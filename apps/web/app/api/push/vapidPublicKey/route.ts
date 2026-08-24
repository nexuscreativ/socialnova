import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET() {
  const upstream = await fetch(`${BACKEND_URL}/push/vapidPublicKey`, { cache: "no-store" })
  const data = await upstream.json().catch(() => null)
  if (!upstream.ok) return NextResponse.json({ error: data?.detail ?? "Not configured" }, { status: upstream.status })
  return NextResponse.json(data)
}
