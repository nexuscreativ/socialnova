import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NOVA_API_URL ?? "http://127.0.0.1:8010"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body?.email === "string" ? body.email : ""
    const password = typeof body?.password === "string" ? body.password : ""
    if (!email.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const upstream = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Invalid email or password" },
        { status: upstream.status },
      )
    }

    const res = NextResponse.json({
      user: data.user,
      access_token: data.access_token,
      expires_in: data.expires_in,
    })

    const maxAge = Math.max(60, data.expires_in ?? 30 * 60)
    res.cookies.set("sn_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    })

    return res
  } catch (err) {
    console.error("login proxy error:", err)
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 },
    )
  }
}