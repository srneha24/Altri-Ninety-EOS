"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDemoWorkspace } from "@/components/demo-workspace-provider"
import { clearTokens, getRefreshToken, refreshSession } from "@/lib/auth"
import type { DemoRole } from "@/lib/demo-data"

type WorkspaceShellProps = {
  activePage: "team" | "meeting"
  children: ReactNode
}

const roleLabels: Record<DemoRole, string> = {
  admin: "Admin",
  team_member: "Team Member",
  observer: "Observer",
}

export function WorkspaceShell({
  activePage,
  children,
}: WorkspaceShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const {
    currentUser,
    role,
    setRole,
    teams,
    selectedTeamId,
    selectedTeam,
    setSelectedTeamId,
  } = useDemoWorkspace()

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
  }, [router, pathname])

  function handleLogout() {
    clearTokens()
    router.replace("/login")
  }

  if (!isReady) {
    return <main className="min-h-svh bg-[#faf8f6]" />
  }

  return (
    <div className="min-h-svh bg-[#faf8f6] md:pl-64">
      <aside className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-[#eee5de] bg-white px-4 md:inset-y-0 md:right-auto md:h-auto md:w-64 md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-4 md:py-6">
        <Link
          aria-label="Altri team workspace"
          className="flex min-w-0 items-center gap-3 md:mb-10"
          href="/"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffc078] text-xs font-bold tracking-tight text-[#3d2517]">
            A
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold tracking-[0.16em] text-[#3d2517]">
              ALTRI
            </span>
            <span className="hidden text-[11px] text-[#91867e] md:block">
              EOS workspace
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="ml-auto flex items-center gap-1 md:ml-0 md:flex-1 md:flex-col md:items-stretch"
        >
          <Link
            aria-current={activePage === "team" ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium md:w-full md:gap-3 ${
              activePage === "team"
                ? "bg-orange-50 text-[#8e4214]"
                : "text-[#756d67] hover:bg-orange-50/70 hover:text-[#8e4214]"
            }`}
            href="/"
          >
            <LayoutDashboard aria-hidden="true" className="size-[18px]" />
            <span>Team</span>
          </Link>
          <Link
            aria-current={activePage === "meeting" ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium md:w-full md:gap-3 ${
              activePage === "meeting"
                ? "bg-orange-50 text-[#8e4214]"
                : "text-[#756d67] hover:bg-orange-50/70 hover:text-[#8e4214]"
            }`}
            href="/meeting"
          >
            <CalendarDays aria-hidden="true" className="size-[18px]" />
            <span>Meeting</span>
          </Link>
        </nav>

        <div className="hidden rounded-xl border border-[#eee5de] bg-[#faf8f6] p-3 md:block">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-[#f7e5d7] text-[11px] font-semibold text-[#8e4214]">
              {currentUser.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-[#30261f]">
                {currentUser.name}
              </span>
              <span className="block text-[11px] text-[#91867e]">
                {roleLabels[role]}
              </span>
            </span>
          </div>
        </div>

        <Button
          aria-label="Log out"
          className="ml-1 rounded-lg text-[#756d67] hover:bg-orange-50 hover:text-[#8e4214] md:ml-0 md:self-end"
          onClick={handleLogout}
          size="icon"
          title="Log out"
          type="button"
          variant="ghost"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
        </Button>
      </aside>

      <main className="min-h-svh bg-[#faf8f6] pt-16 md:pt-0">
        <header className="border-b border-[#eee5de] bg-white px-5 py-5 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid size-9 place-items-center rounded-xl bg-[#f7e5d7] text-[#9b4d18]">
                <UsersRound aria-hidden="true" className="size-[18px]" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-[#91867e]">
                  WORKSPACE
                </p>
                <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-[#30261f]">
                  {activePage === "team" ? "Team" : "Level 10 Meeting"}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-[#756d67]">
                Team
                <select
                  aria-label="Select team"
                  className="h-10 min-w-44 rounded-lg border border-[#e7ded6] bg-white px-3 text-sm text-[#30261f] outline-none focus:border-[#c96a29] focus:ring-4 focus:ring-[#c96a29]/10"
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  value={selectedTeamId}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#756d67]">
                Preview role
                <select
                  aria-label="Preview role"
                  className="h-10 rounded-lg border border-[#e7ded6] bg-white px-3 text-sm text-[#30261f] outline-none focus:border-[#c96a29] focus:ring-4 focus:ring-[#c96a29]/10"
                  onChange={(event) => setRole(event.target.value as DemoRole)}
                  value={role}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#f0dfd1] bg-[#fff9f3] px-4 py-3 text-xs text-[#8a5836]">
            <span>
              <strong className="font-semibold">Demo workspace.</strong>{" "}
              Placeholder data and actions are local to this browser.
            </span>
            <span className="hidden rounded-full bg-white px-2.5 py-1 font-medium text-[#9b4d18] sm:inline-flex">
              {selectedTeam.name}
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
