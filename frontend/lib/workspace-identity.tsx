"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { DemoUser } from "@/lib/types"

const WorkspaceIdentityContext = createContext<DemoUser | null>(null)

export function WorkspaceIdentityProvider({
  user,
  children,
}: {
  user: DemoUser
  children: ReactNode
}) {
  return (
    <WorkspaceIdentityContext.Provider value={user}>
      {children}
    </WorkspaceIdentityContext.Provider>
  )
}

export function useWorkspaceIdentity(): DemoUser | null {
  return useContext(WorkspaceIdentityContext)
}
