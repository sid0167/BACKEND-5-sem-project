from flask import Flask, request, jsonify
import yfinance as yf
import pandas as pd
import numpy as np
from flask_cors import CORS
print("🚀 Running analyze_server.py with /analyze endpoint on port 5001")





app = Flask(__name__)
CORS(app) 
app.url_map.strict_slashes = False

# ----------------------------------------------------------
# Utility Functions: indicators + helpers
# ----------------------------------------------------------
def ema(s, n):
    return s.ewm(span=n, adjust=False).mean()

def rsi(s, n=14):
    delta = s.diff()
    up = pd.Series(np.where(delta > 0, delta, 0.0), index=s.index)
    dn = pd.Series(np.where(delta < 0, -delta, 0.0), index=s.index)
    roll_up = up.ewm(span=n, adjust=False).mean()
    roll_dn = dn.ewm(span=n, adjust=False).mean()
    rs = roll_up / (roll_dn + 1e-9)
    return 100 - (100 / (1 + rs))

def macd(s, fast=12, slow=26, signal=9):
    macd_line = ema(s, fast) - ema(s, slow)
    signal_line = ema(macd_line, signal)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist

def bbands(s, n=20, k=2):
    mid = s.rolling(n).mean()
    std = s.rolling(n).std()
    upper = mid + k * std
    lower = mid - k * std
    return upper, mid, lower

def atr(df, n=14):
    h, l, c = df["High"], df["Low"], df["Close"]
    hl = (h - l).abs()
    hc = (h - c.shift()).abs()
    lc = (l - c.shift()).abs()
    tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
    return tr.rolling(n).mean()

def trend_tag(close):
    e20, e50 = ema(close, 20), ema(close, 50)
    _, _, hist = macd(close)
    if e20.iloc[-1] > e50.iloc[-1] and hist.iloc[-1] > 0:
        return "Up"
    if e20.iloc[-1] < e50.iloc[-1] and hist.iloc[-1] < 0:
        return "Down"
    return "Sideways"

# ----------------------------------------------------------
# Composite Scoring (AI-like logic)
# ----------------------------------------------------------
def composite_score(df):
    close = df["Close"]
    rsi14 = rsi(close).iloc[-1]
    _, _, hist = macd(close)
    hist_last = hist.iloc[-1]
    e20, e50 = ema(close, 20), ema(close, 50)
    ema_spread = (e20.iloc[-1] - e50.iloc[-1]) / (close.iloc[-1] + 1e-9)
    u, mid, l = bbands(close)
    bb_pos = (close.iloc[-1] - l.iloc[-1]) / ((u.iloc[-1] - l.iloc[-1]) + 1e-9)
    ret_1d = close.pct_change().iloc[-1]
    ret_5d = close.pct_change(5).iloc[-1]
    risk = atr(df).iloc[-1] / (close.iloc[-1] + 1e-9)

    comp = {
        "rsi_balance": (50 - abs(50 - rsi14)) / 50,
        "macd_hist": np.tanh(hist_last * 10),
        "ema_trend": np.tanh(ema_spread * 200),
        "bb_pos": (bb_pos - 0.5) * 2,
        "ret_1d": np.tanh(ret_1d * 10),
        "ret_5d": np.tanh(ret_5d * 5),
        "risk_penalty": -np.tanh(risk * 10),
    }

    weights = {
        "rsi_balance": 1,
        "macd_hist": 1.2,
        "ema_trend": 1.2,
        "bb_pos": 0.6,
        "ret_1d": 0.8,
        "ret_5d": 1.0,
        "risk_penalty": 1.0,
    }

    score = sum(comp[k] * weights[k] for k in comp)
    return float(score), float(rsi14), bool(e20.iloc[-1] > e50.iloc[-1])

def map_recommendation(score):
    if score > 1.2:
        return "Buy"
    if score < -1.2:
        return "Sell"
    return "Hold"

# ----------------------------------------------------------
# Data Fetcher (Yahoo Finance) — with all fixes
# ----------------------------------------------------------
def fetch_history(symbol, period="5d", interval="15m"):
    df = yf.download(symbol, period=period, interval=interval, progress=False)
    df = df.dropna()

    # Flatten multi-index columns if Yahoo returns e.g. ('Close','TITAN.NS')
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] for col in df.columns]

    # Normalize casing
    df = df.rename(
        columns={
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "volume": "Volume",
        }
    )

    # Flatten 2D Close columns
    if isinstance(df["Close"], pd.DataFrame):
        df["Close"] = df["Close"].iloc[:, 0]

    return df

# ----------------------------------------------------------
# API Endpoints
# ----------------------------------------------------------
@app.route("/analyze", methods=["GET"])

def analyze():
    symbol = request.args.get("symbol", "").strip()
    period = request.args.get("period", "5d")
    interval = request.args.get("interval", "15m")

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400

    try:
        df = fetch_history(symbol, period=period, interval=interval)

        # Flatten Close in case of 2D issue
        if isinstance(df["Close"], pd.DataFrame):
            df["Close"] = df["Close"].iloc[:, 0]

        if len(df) < 60:
            return jsonify({"error": "not enough data"}), 400

        score, rsi14, ema_flag = composite_score(df)
        rec = map_recommendation(score)
        tag = trend_tag(df["Close"])
        last_close = float(df["Close"].iloc[-1])

        spark = df["Close"].tail(60).reset_index()
        spark = [{"t": str(row[0]), "c": float(row[1])} for row in spark.values]

        return jsonify(
            {
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "lastClose": last_close,
                "trend": tag,
                "score": score,
                "recommendation": rec,
                "indicators": {
                    "rsi14": rsi14,
                    "ema20_gt_ema50": ema_flag,
                },
                "sparkline": spark,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/rank", methods=["POST"])
def rank():
    body = request.get_json(force=True)
    symbols = body.get("symbols", [])
    period = body.get("period", "5d")
    interval = body.get("interval", "15m")

    results = []
    for sym in symbols:
        try:
            df = fetch_history(sym, period=period, interval=interval)
            if isinstance(df["Close"], pd.DataFrame):
                df["Close"] = df["Close"].iloc[:, 0]
            if len(df) < 60:
                continue

            score, rsi14, ema_flag = composite_score(df)
            results.append(
                {
                    "symbol": sym,
                    "score": score,
                    "recommendation": map_recommendation(score),
                    "trend": trend_tag(df["Close"]),
                    "lastClose": float(df["Close"].iloc[-1]),
                    "rsi14": rsi14,
                    "ema20_gt_ema50": ema_flag,
                }
            )
        except Exception:
            continue

    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"ranked": results})

# ----------------------------------------------------------
# Run Server
# ----------------------------------------------------------
if __name__ == "__main__":
    # Use 5001 or 5002 if 5001 already in use
    app.run(host="0.0.0.0", port=5002)
