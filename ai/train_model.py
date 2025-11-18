import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
from pathlib import Path

np.random.seed(42)

N = 200
price = 2500 + np.cumsum(np.random.normal(0, 10, N))

high = price + np.abs(np.random.normal(0, 0.1, N))
low = price - np.abs(np.random.normal(0, 0.1, N))
openp = price + np.random.normal(0, 0.05, N)
close = price + np.random.normal(0, 0.05, N)
volume = np.random.randint(1000, 10000, N)
time = pd.date_range("2025-01-01 09:15", periods=N, freq="min")

df = pd.DataFrame({
    "Time": time,
    "Symbol": ["DEMO"] * N,
    "Open": openp,
    "High": high,
    "Low": low,
    "Close": close,
    "Volume": volume
})

df["NextClose"] = df["Close"].shift(-1)
df = df.dropna()

features = ["Open", "High", "Low", "Close", "Volume"]
X = df[features]
y = df["NextClose"]

model = RandomForestRegressor(n_estimators=200, random_state=42)
model.fit(X, y)
joblib.dump(model, "model.pkl")

Path("../data").mkdir(exist_ok=True)
df.to_excel("../data/sample_live_stock_data.xlsx", index=False)

print("✅ Model trained and sample Excel created at ../data/sample_live_stock_data.xlsx")
