"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StockRow from "../components/StockRow";
import OrderModal from "../components/OrderModal";

export default function Page() {
  const [stocks, setStocks] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderState, setOrderState] = useState({ open: false, stock: null, side: 'buy' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/recommend");
        setStocks(res.data || []);
      } catch (err) {
        console.error(err);
        // fallback mock
        setStocks((prev) => prev.length ? prev : [{ symbol: 'INFY', lastPrice: 1500, changePercent: '+0.5', predictedNext: 1505, recommendation: 'Buy' }]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch orders from backend if user is logged in
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`http://localhost:5000/portfolio/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredStocks = stocks.filter((s) => s.symbol.toLowerCase().includes(query.toLowerCase()));

  const openChart = async (stock) => {
    try {
      const ySymbol = stock.symbol.endsWith('.NS') ? stock.symbol : `${stock.symbol}.NS`;
    const { data } = await axios.get(`http://localhost:5000/analyze/${ySymbol}`);


      setSelectedStock({ ...stock, ...data });
    } catch (e) {
      // fallback
      setSelectedStock({ ...stock, trend: 'Unknown', score: 0, indicators: {}, sparkline: [] });
    }
  };

  const closeChart = () => setSelectedStock(null);

  const handleOrder = (stock, side) => {
    if (!user) {
      alert('Please login to place orders');
      return;
    }
    setOrderState({ open: true, stock, side });
  };

  const placeOrder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to place orders');
        return;
      }

      const res = await axios.post(
        'http://localhost:5000/portfolio/order',
        { symbol: order.symbol, side: order.side, qty: order.qty, price: order.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders([res.data, ...orders]);
      alert(`${order.side.toUpperCase()} order placed: ${order.qty} ${order.symbol} @ ${order.price}`);
    } catch (err) {
      alert('Failed to place order: ' + (err.response?.data?.error || err.message));
    }
  };

  const closeOrder = () => setOrderState({ open: false, stock: null, side: 'buy' });


  return (
    <main style={{ padding: 0, fontFamily: "Inter, system-ui, sans-serif", color: "#f2f2f2", backgroundColor: "transparent", minHeight: "70vh" }}>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "#66fcf1", fontSize: 24, marginBottom: 8 }}>📈 Markets</h1>

          <input
            type="text"
            placeholder="Search stock (e.g., TITAN, SBIN, INFY)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: "10px 14px", margin: "8px 0 18px 0", borderRadius: "8px", border: "1px solid #45a29e", background: "#0f1a1b", color: "white", width: "100%", maxWidth: "480px" }}
          />

          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #1f2833", background: "#1a1a1d", boxShadow: "0 4px 8px rgba(0,0,0,.5)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
              <thead style={{ background: "#1f2833", color: "#66fcf1" }}>
                <tr>
                  <th style={{ padding: "10px" }}>Symbol</th>
                  <th>Last Price</th>
                  <th>Change (%)</th>
                  <th>Predicted Next</th>
                  <th>AI Recommendation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length > 0 ? filteredStocks.map((s, i) => (
                  <StockRow key={s.symbol || i} s={s} onView={openChart} onOrder={handleOrder} />
                )) : (
                  <tr><td colSpan="6" style={{ textAlign:'center', padding:20 }}>No stocks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside style={{ width: 360 }}>
          <div style={{ background:'#0f1a1b', padding:12, borderRadius:8 }}>
            <h3 style={{ color:'#66fcf1' }}>Orders</h3>
            {orders.length === 0 ? <div style={{ color:'#9dbdbb' }}>No orders yet</div> : (
              <ul style={{ listStyle: 'none', marginTop: 8, display:'flex', flexDirection:'column', gap:8 }}>
                {orders.map((o, idx) => (
                  <li key={idx} style={{ padding:8, background:'#071a1a', borderRadius:6 }}>
                    <div style={{ fontWeight:700 }}>{o.side.toUpperCase()} {o.symbol}</div>
                    <div style={{ fontSize:13, color:'#cfeeee' }}>{o.qty} @ {o.price}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ height: 16 }} />

          <div style={{ background:'#0f1a1b', padding:12, borderRadius:8 }}>
            <h3 style={{ color:'#66fcf1' }}>AI Notes</h3>
            <div style={{ color:'#9dbdbb', fontSize:13 }}>Recommendations shown are model suggestions only. Use your discretion before trading.</div>
          </div>
        </aside>
      </div>

      {selectedStock && (
        <div style={{ position: 'fixed', top: 0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }} onClick={closeChart}>
          <div style={{ background:'#1f2833', padding:24, borderRadius:10, width:'80%', maxWidth:800 }} onClick={(e)=>e.stopPropagation()}>
            <h2 style={{ color:'#66fcf1' }}>{selectedStock.symbol} — AI Trend ({selectedStock.trend})</h2>
            <p style={{ marginBottom:8 }}><b>Recommendation:</b> <span style={{ color: selectedStock.recommendation==='Buy'? '#00ff7f' : selectedStock.recommendation==='Sell' ? '#ff6b6b' : '#f1c40f' }}>{selectedStock.recommendation}</span> | <b>Score:</b> {selectedStock.score?.toFixed ? selectedStock.score.toFixed(2) : selectedStock.score}</p>

            <p><b>RSI:</b> {selectedStock.indicators?.rsi14?.toFixed(2)} | <b>EMA20&gt;EMA50:</b> {selectedStock.indicators?.ema20_gt_ema50? '✅ Yes' : '❌ No'}</p>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedStock.sparkline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="t" hide />
                <YAxis stroke="#66fcf1" />
                <Tooltip />
                <Line type="monotone" dataKey="c" stroke="#45a29e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 12, display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={closeChart} style={{ padding:'8px 12px', borderRadius:6, background:'#2b3b3b', border:'none', color:'#cfeeee' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <OrderModal open={orderState.open} onClose={closeOrder} stock={orderState.stock} side={orderState.side} onPlace={placeOrder} />
    </main>
  );
}
