import { NextResponse } from "next/server";

export async function GET(req, context) {
  const symbol = context.params?.symbol;

  // 🔥 HARD GUARD
  if (!symbol || symbol === "undefined") {
    return NextResponse.json(
      { error: "Invalid symbol" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `http://ai-analyze:5002/analyze?symbol=${encodeURIComponent(symbol)}&period=5d&interval=15m`
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (e) {
    return NextResponse.json(
      { error: "AI analyze service unreachable" },
      { status: 500 }
    );
  }
}
