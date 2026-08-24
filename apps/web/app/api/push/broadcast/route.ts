import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.text()
  const upstream = await fetch(`${BACKEND_URL}/push/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body,
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Broadcast failed" }, { status: upstream.status })
  return NextResponse.json(data)
}
