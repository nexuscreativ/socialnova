import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const token = req.cookies.get("sn_token")?.value
  const upstreamPath = ["users", "me", ...path].join("/")
  const search = req.nextUrl.search

  try {
    const upstream = await fetch(`${BACKEND_URL}/${upstreamPath}${search}`, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" }
        : { "Cache-Control": "no-store" },
      cache: "no-store",
    })
    const data = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Request failed" },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("users me proxy error:", err)
    return NextResponse.json(
      { error: "Users service unavailable" },
      { status: 503 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstreamPath = ["users", "me", ...path].join("/")
  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/${upstreamPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    })
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Request failed" },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error("users me proxy error:", err)
    return NextResponse.json(
      { error: "Users service unavailable" },
      { status: 503 },
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstreamPath = ["users", "me", ...path].join("/")
  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/${upstreamPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    })
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Request failed" },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("users me proxy error:", err)
    return NextResponse.json(
      { error: "Users service unavailable" },
      { status: 503 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstreamPath = ["users", "me", ...path].join("/")
  try {
    const upstream = await fetch(`${BACKEND_URL}/${upstreamPath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Request failed" },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("users me proxy error:", err)
    return NextResponse.json(
      { error: "Users service unavailable" },
      { status: 503 },
    )
  }
}