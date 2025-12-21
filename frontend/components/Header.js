"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) setUser(u);
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    location.href = "/";
  };

  if (!mounted) return null;

  return (
    <header style={{ background: "#071014", borderBottom: "1px solid #172a2b" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, padding: "12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#66fcf1", fontWeight: 800, fontSize: 20 }}>StockAI</div>
          <div style={{ color: "#9dbdbb", fontSize: 13 }}>Live market insights</div>
        </div>

        <nav style={{ marginLeft: 24, display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/">Markets</Link>
          <a href="#">News</a>
          <Link href="/portfolio">Portfolio</Link>
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks (TCS, INFY...)"
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #173536", background: "#0f1a1b", color: "#cfeeee" }}
          />

          {user ? (
            <>
              <div style={{ color: "#cfeeee", marginRight: 8 }}>{user.name}</div>
              <button onClick={logout} style={{ background: "#45a29e", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button style={{ background: "transparent", border: "1px solid #2f6b68", color: "#cfeeee", padding: "8px 12px", borderRadius: 6 }}>Login</button>
              </Link>
              <Link href="/signup">
                <button style={{ background: "#45a29e", border: "none", padding: "8px 12px", borderRadius: 6 }}>Sign up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
