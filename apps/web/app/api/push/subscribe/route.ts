import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.text()
  const upstream = await fetch(`${BACKEND_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body,
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Subscribe failed" }, { status: upstream.status })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.text()
  const url = new URL(req.url)
  const endpoint = url.searchParams.get("endpoint") || (() => { try { return JSON.parse(body || "{}").endpoint } catch { return null } })()
  const target = endpoint ? `${BACKEND_URL}/push/subscribe?endpoint=${encodeURIComponent(endpoint)}` : `${BACKEND_URL}/push/subscribe`
  const upstream = await fetch(target, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body || undefined,
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Unsubscribe failed" }, { status: upstream.status })
  return NextResponse.json(data)
}
