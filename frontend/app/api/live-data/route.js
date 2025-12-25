import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://backend:5000/live-data");

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 500 }
    );
  }
}
