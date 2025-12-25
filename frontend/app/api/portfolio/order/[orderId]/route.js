import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const token =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 403 }
    );
  }

  const res = await fetch(
    `http://backend:5000/portfolio/${params.orderId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: token.startsWith("Bearer")
          ? token
          : `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
