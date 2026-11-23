"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clearTokens, getRefreshToken, refreshSession } from "@/lib/auth"

export default function Page() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!getRefreshToken()) {
        router.replace("/login")
        return
      }

      try {
        await refreshSession()
        if (active) {
          setIsReady(true)
        }
      } catch {
        if (active) {
          router.replace("/login?session=expired")
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [router])

  function handleLogout() {
    clearTokens()
    router.replace("/login")
  }

  if (!isReady) {
    return <main className="min-h-svh bg-[#faf8f6]" />
  }

  return (
    <div className="min-h-svh bg-[#faf8f6] md:pl-64">
      <aside className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-[#eee5de] bg-white px-4 md:inset-y-0 md:right-auto md:h-auto md:w-64 md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-4 md:py-6">
        <div className="flex min-w-0 items-center gap-3 md:mb-10">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffc078] text-xs font-bold tracking-tight text-[#3d2517]">
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#3d2517]">
              ALTRI
            </p>
            <p className="hidden text-[11px] text-[#91867e] md:block">
              EOS workspace
            </p>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="ml-auto flex items-center md:ml-0 md:flex-1"
        >
          <Link
            aria-current="page"
            className="inline-flex h-10 items-center gap-3 rounded-lg bg-orange-50 px-3 text-sm font-medium text-[#8e4214] md:w-full"
            href="/"
          >
            <LayoutDashboard aria-hidden="true" className="size-[18px]" />
            Overview
          </Link>
        </nav>

        <Button
          aria-label="Log out"
          className="ml-3 rounded-lg text-[#756d67] hover:bg-orange-50 hover:text-[#8e4214] md:ml-0 md:self-end"
          onClick={handleLogout}
          size="icon"
          title="Log out"
          type="button"
          variant="ghost"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
        </Button>
      </aside>

      <main
        aria-label="Workspace landing page"
        className="min-h-svh bg-[#faf8f6] pt-16 md:pt-0"
      />
    </div>
  )
}
