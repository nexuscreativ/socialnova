import { NextResponse, NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  const token = req.cookies.get("sn_token")?.value
  const backend = process.env.NOVA_API_URL

  // Call backend to revoke refresh tokens so the session is fully closed
  // server-side. The cookie is always cleared locally regardless of outcome.
  if (token && backend) {
    try {
      await fetch(`${backend}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    } catch {
      // ignore: still clear the cookie below
    }
  }

  res.cookies.set("sn_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: true,
  })
  return res
}
