#!/bin/sh

echo "🚀 Starting AI Predict Server (5001)"
python predict/ai_server.py &

echo "🚀 Starting AI Analyze Server (5002)"
python analyze/analyze_server.py &

wait
