import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://backend:5000/recommend");

    if (!res.ok) {
      return NextResponse.json(
        { error: "AI backend error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "AI service unreachable" },
      { status: 500 }
    );
  }
}
