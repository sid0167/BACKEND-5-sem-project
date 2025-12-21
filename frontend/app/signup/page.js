"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError("Please provide all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ paddingTop: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', background:'#0f1a1b', padding: 20, borderRadius:8 }}>
        <h2 style={{ color:'#66fcf1' }}>Create account</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" style={{ padding: 10, borderRadius:6, border:'1px solid #173536', background:'#071014', color:'#cfeeee' }} />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" style={{ padding: 10, borderRadius:6, border:'1px solid #173536', background:'#071014', color:'#cfeeee' }} />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" style={{ padding: 10, borderRadius:6, border:'1px solid #173536', background:'#071014', color:'#cfeeee' }} />
          {error && <div style={{ color:'#ff6b6b' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: 10, borderRadius:6, border:'none', background:'#45a29e', color:'#071014', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
