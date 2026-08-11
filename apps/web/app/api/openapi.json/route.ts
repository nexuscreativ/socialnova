import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET() {
  try {
    const upstream = await fetch(`${BACKEND_URL}/api/openapi.json`, { cache: "no-store" })
    const data = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "OpenAPI service unavailable" },
        { status: upstream.status },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("openapi proxy error:", err)
    return NextResponse.json(
      { error: "OpenAPI service unavailable" },
      { status: 503 },
    )
  }
}