import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = [
  "/dashboard",
  "/chat",
  "/content",
  "/campaigns",
  "/agents",
  "/analytics",
  "/settings",
  "/admin",
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PATHS.some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get("sn_token")?.value
  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/content/:path*",
    "/campaigns/:path*",
    "/agents/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
}