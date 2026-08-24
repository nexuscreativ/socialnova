import { NextRequest } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  const body = await req.text()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const upstream = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers,
    body,
  })

  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => null)
    return new Response(JSON.stringify({ error: data?.detail ?? "Chat stream unavailable" }), {
      status: upstream.status || 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(upstream.body as unknown as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
