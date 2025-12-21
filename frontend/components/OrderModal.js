"use client";
import { useState } from "react";

export default function OrderModal({ open, onClose, stock, side, onPlace }) {
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(stock?.lastPrice || "");

  if (!open) return null;

  const place = () => {
    const order = { symbol: stock.symbol, side, qty: Number(qty), price: Number(price), time: Date.now() };
    onPlace(order);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#1f2833", padding: 20, width: 420, borderRadius: 8 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: "#66fcf1" }}>{side === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}</h3>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>
            Qty
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6, borderRadius: 6, border: '1px solid #173536', background:'#0f1a1b', color:'#cfeeee' }} />
          </label>
          <label style={{ flex: 1 }}>
            Price
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6, borderRadius: 6, border: '1px solid #173536', background:'#0f1a1b', color:'#cfeeee' }} />
          </label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius:6, background:'#2b3b3b', border:'none', color:'#cfeeee' }}>Cancel</button>
          <button onClick={place} style={{ padding: '8px 12px', borderRadius:6, background:'#45a29e', border:'none', color:'#071014', fontWeight:700 }}>Place Order</button>
        </div>
      </div>
    </div>
  );
}
