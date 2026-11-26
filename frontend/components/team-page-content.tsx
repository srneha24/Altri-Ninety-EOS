"use client"

import { IssuesSection } from "@/components/issues-section"
import { RocksSection } from "@/components/rocks-section"
import { ScorecardSection } from "@/components/scorecard-section"
import { TodosSection } from "@/components/todos-section"
import { useTeamWorkspace } from "@/components/team-workspace-provider"

export function TeamPageContent() {
  const { loading, loaded, error } = useTeamWorkspace()

  if (loading) {
    return (
      <p className="rounded-xl border border-[#eee5de] bg-white px-5 py-4 text-sm text-[#756d67]">
        Loading team workspace…
      </p>
    )
  }

  if (error && !loaded) {
    return (
      <p
        aria-live="polite"
        className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        role="alert"
      >
        {error}
      </p>
    )
  }

  return (
    <>
      {error ? (
        <p
          aria-live="polite"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="space-y-6">
        <ScorecardSection />
        <IssuesSection />
        <TodosSection />
        <RocksSection />
      </div>
    </>
  )
}
