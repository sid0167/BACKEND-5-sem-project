import { NextResponse } from "next/server";

export async function POST(req) {
  const token =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 403 }
    );
  }

  const body = await req.json();

  try {
    const res = await fetch("http://backend:5000/portfolio/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer")
          ? token
          : `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 500 }
    );
  }
}
