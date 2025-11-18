from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)
model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json.get("data")
    if not data:
        return jsonify({"error": "No data provided"}), 400

    df = pd.DataFrame([data])
    features = ["Open", "High", "Low", "Close", "Volume"]
    prediction = float(model.predict(df[features])[0])
    current_close = float(df["Close"][0])

    if prediction > current_close * 1.01:
        rec = "Buy"
    elif prediction < current_close * 0.99:
        rec = "Sell"
    else:
        rec = "Hold"

    return jsonify({
        "predicted_price": prediction,
        "recommendation": rec
    })

if __name__ == "__main__":
    app.run(port=5001)
