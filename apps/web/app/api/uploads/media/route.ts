import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/uploads/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
    })
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Upload failed" },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("uploads proxy error:", err)
    return NextResponse.json(
      { error: "Upload service unavailable" },
      { status: 503 },
    )
  }
}