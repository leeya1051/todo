import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // NextAuth handler and public registration endpoint stay reachable.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/board/:path*",
    "/weekly-plans/:path*",
    "/year-goals/:path*",
    "/daily/:path*",
    "/stats/:path*",
    "/api/:path*",
  ],
}
