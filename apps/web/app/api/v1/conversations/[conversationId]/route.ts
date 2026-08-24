import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const upstream = await fetch(`${BACKEND_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Not found" }, { status: upstream.status })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const token = req.cookies.get("sn_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const upstream = await fetch(`${BACKEND_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Delete failed" }, { status: upstream.status })
  return NextResponse.json(data)
}
