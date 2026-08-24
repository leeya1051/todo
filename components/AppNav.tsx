"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/board", label: "보드" },
  { href: "/daily", label: "날짜별" },
  { href: "/weekly-plans", label: "주간 계획" },
  { href: "/year-goals", label: "1년 목표" },
  { href: "/stats", label: "통계" },
] as const

export function AppNav() {
  const pathname = usePathname()

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null
  }

  return (
    <aside className="flex h-screen w-48 shrink-0 flex-col border-r p-4">
      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted font-semibold text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        로그아웃
      </Button>
    </aside>
  )
}

export default AppNav
