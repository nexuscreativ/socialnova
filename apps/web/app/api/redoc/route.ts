import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET() {
  try {
    const upstream = await fetch(`${BACKEND_URL}/api/redoc`, { cache: "no-store" })
    const html = await upstream.text()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Docs service unavailable" },
        { status: upstream.status },
      )
    }

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (err) {
    console.error("redoc proxy error:", err)
    return NextResponse.json(
      { error: "Docs service unavailable" },
      { status: 503 },
    )
  }
}