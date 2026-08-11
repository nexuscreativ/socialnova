import { NextRequest, NextResponse } from "next/server"

// The FastAPI backend base URL. Override via env in production; defaults to
// the local dev backend on :8010.
const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("sn_token")?.value
    const body = await req.json()
    const message = typeof body?.message === "string" ? body.message : ""
    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`

    const upstream = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversation_id: body.conversation_id ?? undefined,
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Chat service unavailable" },
        { status: upstream.status },
      )
    }

    return NextResponse.json({
      response: data.response,
      agent_used: data.agent_used,
      conversation_id: data.conversation_id,
      metadata: data.metadata,
    })
  } catch (err) {
    console.error("chat proxy error:", err)
    return NextResponse.json(
      { error: "Chat service unavailable" },
      { status: 503 },
    )
  }
}