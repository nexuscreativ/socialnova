import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

async function proxy(
  req: NextRequest,
  params: { path: string[] },
  method: string,
) {
  const { path } = params
  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstreamPath = ["admin", ...path].join("/")
  const search = req.nextUrl.search

  let body: unknown
  const hasBody = !["GET", "HEAD"].includes(method)
  if (hasBody) {
    try {
      body = await req.json()
    } catch {
      body = {}
    }
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (hasBody) headers["Content-Type"] = "application/json"

  try {
    const upstream = await fetch(`${BACKEND_URL}/${upstreamPath}${search}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body ?? {}) : undefined,
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
    console.error("admin proxy error:", err)
    return NextResponse.json(
      { error: "Admin service unavailable" },
      { status: 503 },
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, await params, "GET")
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, await params, "PUT")
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, await params, "PATCH")
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, await params, "POST")
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, await params, "DELETE")
}