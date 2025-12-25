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
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/portfolio", {
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
      await axios.delete(`/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete");
    }
  };

  // Aggregate holdings
  const holdings = orders.reduce((acc, o) => {
    const sign = o.side === "buy" ? 1 : -1;
    acc[o.symbol] ??= { symbol: o.symbol, qty: 0, sum: 0 };
    acc[o.symbol].qty += sign * o.qty;
    acc[o.symbol].sum += sign * o.qty * o.price;
    return acc;
  }, {});

  const holdingsList = Object.values(holdings).map((h) => ({
    symbol: h.symbol,
    qty: h.qty,
    avgPrice: h.qty ? Math.abs(h.sum / h.qty).toFixed(2) : 0,
  }));

  return (
    <main style={{ minHeight: "70vh", padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ color: "#66fcf1" }}>My Portfolio</h1>

        {!user && (
          <div style={{ background: "#0f1a1b", padding: 16, borderRadius: 8 }}>
            <p style={{ color: "#cfeeee" }}>You are not logged in.</p>
            <Link href="/login">
              <button style={{ padding: 8, background: "#45a29e", border: "none" }}>
                Login
              </button>
            </Link>
          </div>
        )}

        {user && (
          <>
            <h3 style={{ color: "#66fcf1", marginTop: 20 }}>Holdings</h3>
            {holdingsList.length === 0 ? (
              <p style={{ color: "#9dbdbb" }}>No holdings</p>
            ) : (
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsList.map((h) => (
                    <tr key={h.symbol}>
                      <td>{h.symbol}</td>
                      <td>{h.qty}</td>
                      <td>{h.avgPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 style={{ color: "#66fcf1", marginTop: 20 }}>Orders</h3>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {orders.map((o) => (
              <div key={o._id} style={{ marginTop: 10 }}>
                {o.symbol} | {o.side} | {o.qty} @ {o.price}
                <button onClick={() => deleteOrder(o._id)}>Delete</button>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
