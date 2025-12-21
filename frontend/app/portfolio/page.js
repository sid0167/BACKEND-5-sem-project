"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function PortfolioPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setUser(u);
    } catch (e) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:5000/portfolio/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this order?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // refresh
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete");
    }
  };

  // Aggregate holdings by symbol (buys +, sells -)
  const holdings = orders.reduce((acc, o) => {
    const sym = o.symbol;
    const sign = o.side === "buy" ? 1 : -1;
    if (!acc[sym]) acc[sym] = { symbol: sym, qty: 0, avgPriceSum: 0, trades: 0 };
    acc[sym].qty += sign * o.qty;
    acc[sym].avgPriceSum += sign * o.price * o.qty;
    acc[sym].trades += 1;
    return acc;
  }, {});

  const holdingsList = Object.values(holdings).map((h) => {
    const avgPrice = h.qty !== 0 ? Math.abs(h.avgPriceSum / (h.qty || 1)) : Math.abs(h.avgPriceSum / h.trades || 0);
    return { symbol: h.symbol, qty: h.qty, avgPrice: Number(avgPrice.toFixed(2)) };
  });

  return (
    <main style={{ minHeight: "70vh", padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 20 }}>
        <section style={{ flex: 1 }}>
          <h1 style={{ color: "#66fcf1" }}>My Portfolio</h1>

          {!user && (
            <div style={{ background: "#0f1a1b", padding: 16, borderRadius: 8 }}>
              <p style={{ color: "#cfeeee" }}>You are not logged in.</p>
              <Link href="/login"><button style={{ marginTop: 8, padding: 8, borderRadius: 6, background: "#45a29e", border: "none", color: "#071014" }}>Login</button></Link>
            </div>
          )}

          {user && (
            <>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <div style={{ background: '#0f1a1b', padding: 12, borderRadius: 8, flex: 1 }}>
                  <h3 style={{ color: '#66fcf1' }}>Holdings</h3>
                  {holdingsList.length === 0 ? (
                    <div style={{ color: '#9dbdbb' }}>No holdings</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ color: '#66fcf1', textAlign: 'left' }}>
                        <tr><th>Symbol</th><th>Qty</th><th>Avg Price</th></tr>
                      </thead>
                      <tbody>
                        {holdingsList.map((h) => (
                          <tr key={h.symbol} style={{ borderTop: '1px solid #172a2b' }}>
                            <td style={{ padding: 8 }}>{h.symbol}</td>
                            <td style={{ padding: 8 }}>{h.qty}</td>
                            <td style={{ padding: 8 }}>{h.avgPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ width: 360, background: '#0f1a1b', padding: 12, borderRadius: 8 }}>
                  <h3 style={{ color: '#66fcf1' }}>Account</h3>
                  <div style={{ color: '#cfeeee' }}><b>{user.name}</b></div>
                  <div style={{ color: '#9dbdbb', fontSize: 13 }}>{user.email}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, background: '#0f1a1b', padding: 12, borderRadius: 8 }}>
                <h3 style={{ color: '#66fcf1' }}>Orders</h3>
                {loading && <div style={{ color: '#9dbdbb' }}>Loading...</div>}
                {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}

                {orders.length === 0 && !loading ? (
                  <div style={{ color: '#9dbdbb' }}>No orders placed yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead style={{ color: '#66fcf1', textAlign: 'left' }}>
                      <tr><th>When</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th></th></tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id} style={{ borderTop: '1px solid #172a2b' }}>
                          <td style={{ padding: 8 }}>{new Date(o.createdAt).toLocaleString()}</td>
                          <td style={{ padding: 8 }}>{o.symbol}</td>
                          <td style={{ padding: 8 }}>{o.side}</td>
                          <td style={{ padding: 8 }}>{o.qty}</td>
                          <td style={{ padding: 8 }}>{o.price}</td>
                          <td style={{ padding: 8 }}>
                            <button onClick={() => deleteOrder(o._id)} style={{ padding: '6px 8px', borderRadius: 6, background: '#ff6b6b', color: '#071014', border: 'none' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  );
}
