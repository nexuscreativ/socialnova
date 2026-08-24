import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const upstream = await fetch(`${BACKEND_URL}/api/v1/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Failed to load conversations" }, { status: upstream.status })
  return NextResponse.json(data)
}
