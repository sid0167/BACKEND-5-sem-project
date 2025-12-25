import express from "express";
import cors from "cors";
import axios from "axios";
import XLSX from "xlsx";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Portfolio from "./models/Portfolio.js";

// Init env
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create server
const app = express();

// ====== FIXED CORS (final safe version) ======
app.use(
  cors({
    origin: [
  "http://localhost:3000",
  "http://frontend:3000"
],

    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Body parser
app.use(express.json());

// Env vars
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://mongo:27017/stock-ai";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const EXCEL_PATH =
  process.env.EXCEL_PATH ||
  path.resolve(__dirname, "../data/sample_live_stock_data.xlsx");

const AI_URL = process.env.AI_URL || "http://ai:5001/predict";
const AI_YAHOO_BASE = process.env.AI_YAHOO_BASE || "http://ai:5002";


// Connect DB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ===== AUTH MIDDLEWARE =====
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ===== READ EXCEL =====
function readExcelData() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// ===== ROUTES =====

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Excel live-data
app.get("/live-data", (req, res) => {
  try {
    res.json(readExcelData());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Prediction route
app.get("/recommend", async (req, res) => {
  try {
    const data = readExcelData();
    const slice = data.slice(0, 50);

    const results = [];
    for (const s of slice) {
      const payload = {
        Open: s["Column1.open"],
        High: s["Column1.dayHigh"],
        Low: s["Column1.dayLow"],
        Close: s["Column1.lastPrice"],
        Volume: s["Column1.ffmc"] || 0,
      };

      const ai = await axios.post(AI_URL, { data: payload });

      results.push({
        symbol: s["Column1.symbol"],
        lastPrice: s["Column1.lastPrice"],
        changePercent: s["Column1.pChange"],
        predictedNext: ai.data.predicted_price,
        recommendation: ai.data.recommendation,
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Yahoo AI proxy =====
  // FINAL FIX


// Analyze stock
app.get("/analyze/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;   // <-- DEFINE IT FIRST
    const symbolParam = symbol.trim();

    // Block symbols with spaces like "NIFTY 50"
    if (symbolParam.includes(" ")) {
      return res.status(400).json({ error: "Index not supported" });
    }

    const period = req.query.period || "5d";
    const interval = req.query.interval || "15m";

    const { data } = await axios.get(`${AI_YAHOO_BASE}/analyze`, {
      params: { symbol: symbolParam, period, interval },
    });

    res.json(data);
  } catch (e) {
    console.error("Analyze error:", e);
    res.status(500).json({ error: e.message });
  }
});


// Rank stocks
app.post("/rank", async (req, res) => {
  try {
    const { symbols, period = "5d", interval = "15m" } = req.body;

    const { data } = await axios.post(`${AI_YAHOO_BASE}/rank`, {
      symbols,
      period,
      interval,
    });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== AUTH =====
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User exists" });

    const user = new User({ email, name, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== PORTFOLIO =====

// Place order
app.post("/portfolio/order", authenticate, async (req, res) => {
  try {
    const { symbol, side, qty, price } = req.body;
    if (!symbol || !side || !qty || price === undefined)
      return res.status(400).json({ error: "Missing fields" });

    const order = await Portfolio.create({
      userId: req.userId,
      symbol,
      side,
      qty,
      price,
    });

    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get portfolio
app.get("/portfolio", authenticate, async (req, res) => {
  try {
    const orders = await Portfolio.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Delete order
app.delete("/portfolio/:orderId", authenticate, async (req, res) => {
  try {
    const order = await Portfolio.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Not found" });

    if (order.userId.toString() !== req.userId)
      return res.status(403).json({ error: "Unauthorized" });

    await order.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
