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
import { SelectMenu } from "@/components/ui/select-menu"
import { TeamWorkspaceProvider } from "@/components/team-workspace-provider"
import { getCurrentUser, getServerNow, getUserTeams, type ApiUser } from "@/lib/api"
import { clearTokens, getRefreshToken, refreshSession } from "@/lib/auth"
import type { DemoRole, DemoTeam, DemoUser } from "@/lib/types"
import { WorkspaceIdentityProvider } from "@/lib/workspace-identity"

type WorkspaceShellProps = {
  activePage: "team" | "meeting"
  children: ReactNode
}

const TEAM_STORAGE_KEY = "altri.workspace.teamId"

const roleLabels: Record<DemoRole, string> = {
  admin: "Admin",
  team_member: "Team Member",
  observer: "Observer",
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

function mapUser(user: ApiUser): DemoUser {
  return { ...user, initials: initials(user.name) }
}

export function WorkspaceShell({
  activePage,
  children,
}: WorkspaceShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [serverNow, setServerNow] = useState<string | undefined>(undefined)
  const [teams, setTeams] = useState<DemoTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const role = currentUser?.role ?? "team_member"

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!getRefreshToken()) {
        clearTokens()
        router.replace("/login")
        return
      }

      try {
        await refreshSession()
      } catch {
        if (active) {
          clearTokens()
          router.replace("/login?session=expired")
        }
        return
      }

      try {
        const [user, availableTeams, serverNowPayload] = await Promise.all([
          getCurrentUser(),
          getUserTeams(),
          getServerNow(),
        ])
        if (active) {
          setCurrentUser(mapUser(user))
          setServerNow(serverNowPayload.server_now)
          setTeams(
            availableTeams.map((team) => ({
              ...team,
              memberIds: [],
            }))
          )
          setSelectedTeamId((previous) => {
            const stored = window.sessionStorage.getItem(TEAM_STORAGE_KEY)
            if (previous && availableTeams.some((team) => team.id === previous)) {
              return previous
            }
            if (stored && availableTeams.some((team) => team.id === stored)) {
              return stored
            }
            return availableTeams[0]?.id ?? ""
          })
          setWorkspaceError(
            availableTeams.length
              ? null
              : "This account does not have access to a team."
          )
          setIsReady(true)
        }
      } catch (error) {
        if (active) {
          setWorkspaceError(
            error instanceof Error ? error.message : "Unable to load workspace."
          )
          setIsReady(true)
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

  if (!currentUser) {
    return (
      <main className="grid min-h-svh place-items-center bg-[#faf8f6] p-6">
        <p
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {workspaceError ?? "Unable to load your account."}
        </p>
      </main>
    )
  }

  const pageContent =
    currentUser && selectedTeamId ? (
      <TeamWorkspaceProvider
        selectedTeamId={selectedTeamId}
        serverNow={serverNow}
        teams={teams}
        user={currentUser}
      >
        {children}
      </TeamWorkspaceProvider>
    ) : (
      children
    )
  const workspaceContent = (
    <WorkspaceIdentityProvider user={currentUser}>
      {pageContent}
    </WorkspaceIdentityProvider>
  )

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

            {teams.length > 1 ? (
              <label className="flex items-center gap-2 text-xs font-medium text-[#756d67]">
                Team
                <SelectMenu
                  ariaLabel="Select team"
                  className="h-10 min-w-44 rounded-lg px-3 text-sm"
                  onChange={(teamId) => {
                    window.sessionStorage.setItem(TEAM_STORAGE_KEY, teamId)
                    setSelectedTeamId(teamId)
                  }}
                  options={teams.map((team) => ({
                    value: team.id,
                    label: team.name,
                  }))}
                  value={selectedTeamId}
                />
              </label>
            ) : selectedTeam ? (
              <span className="rounded-full bg-[#fff9f3] px-3 py-2 text-xs font-medium text-[#9b4d18]">
                {selectedTeam.name}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">
          {workspaceError ? (
            <p
              aria-live="polite"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {workspaceError}
            </p>
          ) : null}
          {workspaceError ? null : workspaceContent}
        </div>
      </main>
    </div>
  )
}
