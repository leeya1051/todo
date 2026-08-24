"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

// A plain server redirect to /api/auth/signin/github fails NextAuth's CSRF
// check (only its client-side signIn() helper submits a matching token), so
// this page triggers the real sign-in flow on mount instead. The ref guard
// stops React StrictMode's dev-mode double-invoke from firing signIn() twice
// and overwriting the OAuth state cookie mid-flow.
export default function GithubSignInPage() {
  const searchParams = useSearchParams()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true
    signIn("github", { callbackUrl: searchParams.get("callbackUrl") ?? "/board" })
  }, [searchParams])

  return null
}
