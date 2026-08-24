"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

// A plain server redirect to /api/auth/signin/github fails NextAuth's CSRF
// check (only its client-side signIn() helper submits a matching token), so
// this page triggers the real sign-in flow on mount instead. The ref guard
// stops React StrictMode's dev-mode double-invoke from firing signIn() twice
// and overwriting the OAuth state cookie mid-flow.
//
// useSearchParams() requires a Suspense boundary during Next's build-time
// prerender shell pass (force-dynamic alone doesn't skip that pass), so the
// hook lives in an inner component wrapped below.
function GithubSignIn() {
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

export default function GithubSignInPage() {
  return (
    <Suspense fallback={null}>
      <GithubSignIn />
    </Suspense>
  )
}
