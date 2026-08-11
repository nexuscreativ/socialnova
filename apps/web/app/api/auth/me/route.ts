import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Unauthorized" },
        { status: upstream.status },
      )
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error("me proxy error:", err)
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 },
    )
  }
}