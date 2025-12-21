"use client";
import React from "react";

export default function StockRow({ s, onView, onOrder }) {
  return (
    <tr style={{ textAlign: "center", borderBottom: "1px solid #222" }}>
      <td style={{ padding: "10px" }}>{s.symbol}</td>
      <td>{s.lastPrice}</td>
      <td>{s.changePercent}</td>
      <td>{s.predictedNext?.toFixed ? s.predictedNext.toFixed(2) : s.predictedNext}</td>
      <td>
        <b style={{ color: s.recommendation === "Buy" ? "#00ff7f" : s.recommendation === "Sell" ? "#ff6b6b" : "#f1c40f" }}>
          {s.recommendation}
        </b>
      </td>
      <td>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => onView(s)} style={{ padding: "6px 10px", background: "#45a29e", border: "none", borderRadius: 6, cursor: "pointer", color: "#071014", fontWeight: 700 }}>View</button>
          <button onClick={() => onOrder(s, 'buy')} style={{ padding: "6px 10px", background: "#12c48b", border: "none", borderRadius: 6, cursor: "pointer", color: "#071014", fontWeight: 700 }}>Buy</button>
          <button onClick={() => onOrder(s, 'sell')} style={{ padding: "6px 10px", background: "#ff6b6b", border: "none", borderRadius: 6, cursor: "pointer", color: "#071014", fontWeight: 700 }}>Sell</button>
        </div>
      </td>
    </tr>
  );
}
