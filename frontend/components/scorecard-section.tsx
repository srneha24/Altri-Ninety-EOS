"use client"

import { useState, type SubmitEvent } from "react"
import { AlertCircle, Check, Clock3, PencilLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTeamWorkspace } from "@/components/team-workspace-provider"
import { useWorkspaceIdentity } from "@/lib/workspace-identity"
import type { DemoMeasurable, Goal } from "@/lib/types"

type ScorecardSectionProps = {
  title?: string
}

type ScoreStatus = "on_track" | "off_track" | "pending"

function goalLabel(goal: Goal, unit: string): string {
  switch (goal.type) {
    case "at_least":
      return `At least ${goal.value} ${unit}`
    case "at_most":
      return `At most ${goal.value} ${unit}`
    case "between":
      return `${goal.min}–${goal.max} ${unit}`
    case "exactly":
      return `Exactly ${goal.value} ${unit}`
  }
}

export function getScoreStatus(
  measurable: DemoMeasurable,
  score: number | null,
  weekStart: string,
  currentWeek: string
): ScoreStatus {
  if (score === null) {
    return weekStart === currentWeek ? "pending" : "off_track"
  }

  switch (measurable.goal.type) {
    case "at_least":
      return score >= measurable.goal.value ? "on_track" : "off_track"
    case "at_most":
      return score <= measurable.goal.value ? "on_track" : "off_track"
    case "between":
      return score >= measurable.goal.min && score <= measurable.goal.max
        ? "on_track"
        : "off_track"
    case "exactly":
      return score === measurable.goal.value ? "on_track" : "off_track"
  }
}

function statusStyle(status: ScoreStatus): string {
  if (status === "on_track") return "bg-emerald-50 text-emerald-800"
  if (status === "off_track") return "bg-rose-50 text-rose-800"
  return "bg-slate-100 text-slate-600"
}

function StatusIcon({ status }: { status: ScoreStatus }) {
  if (status === "on_track") {
    return <Check aria-hidden="true" className="size-3" />
  }
  if (status === "off_track") {
    return <AlertCircle aria-hidden="true" className="size-3" />
  }
  return <Clock3 aria-hidden="true" className="size-3" />
}

function formatWeek(weekStart: string): string {
  return new Date(`${weekStart}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function ScorecardSection({
  title = "Scorecard",
}: ScorecardSectionProps) {
  const workspace = useTeamWorkspace()
  const identity = useWorkspaceIdentity()
  const {
    measurables,
    weeks,
    scores,
    updateScore,
    createIssue,
  } = workspace
  const role = identity?.role ?? workspace.role
  const { members } = workspace
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [notice, setNotice] = useState("")
  const currentWeek = weeks[weeks.length - 1]
  const canEdit = role !== "observer"

  function beginEdit(measurableId: string, weekStart: string) {
    setEditingKey(`${measurableId}:${weekStart}`)
    setEditingValue(scores[measurableId]?.[weekStart]?.toString() ?? "")
  }

  async function saveScore(
    event: SubmitEvent<HTMLFormElement>,
    measurableId: string,
    weekStart: string
  ) {
    event.preventDefault()
    if (editingValue.trim() === "") {
      setNotice("Enter a numeric score.")
      return
    }
    const value = Number(editingValue)
    if (!Number.isFinite(value)) {
      setNotice("Enter a valid numeric score.")
      return
    }
    try {
      await updateScore(measurableId, weekStart, value)
      setEditingKey(null)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to update the score."
      )
    }
  }

  async function makeIssue(measurable: DemoMeasurable, weekStart: string) {
    const weekLabel = formatWeek(weekStart)
    try {
      const issue = await createIssue(
        `${measurable.name} — week of ${weekLabel}`,
        3,
        { measurableId: measurable.id, weekStart }
      )
      setNotice(`“${issue.title}” is on the Issues list.`)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to create the Issue."
      )
    }
  }

  return (
    <section
      aria-labelledby="scorecard-title"
      className="overflow-hidden rounded-2xl border border-[#eee5de] bg-white shadow-sm shadow-[#3d2517]/[0.025]"
    >
      <div className="flex flex-col gap-3 border-b border-[#f1ebe6] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2
            className="text-base font-semibold tracking-[-0.02em] text-[#30261f]"
            id="scorecard-title"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#91867e]">
            Weekly Measurables · 13 weeks including the current week
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
            <Check aria-hidden="true" className="size-3" />
            On track
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-800">
            <AlertCircle aria-hidden="true" className="size-3" />
            Off track
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            <Clock3 aria-hidden="true" className="size-3" />
            Pending
          </span>
        </div>
      </div>

      {notice ? (
        <p
          aria-live="polite"
          className="border-b border-[#f1ebe6] bg-[#fff9f3] px-6 py-2.5 text-xs text-[#8a5836]"
        >
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1260px] border-collapse text-left">
          <thead>
            <tr className="bg-[#fcfaf8]">
              <th
                className="sticky left-0 z-10 w-56 border-b border-[#f1ebe6] bg-[#fcfaf8] px-5 py-3 text-[11px] font-semibold tracking-wide text-[#91867e] uppercase"
                scope="col"
              >
                Measurable
              </th>
              {weeks.map((week) => (
                <th
                  className={`min-w-[78px] border-b border-[#f1ebe6] px-2 py-3 text-center text-[11px] font-semibold ${
                    week === currentWeek
                      ? "text-[#9b4d18]"
                      : "text-[#91867e]"
                  }`}
                  key={week}
                  scope="col"
                >
                  <span className="block">{formatWeek(week)}</span>
                  {week === currentWeek ? (
                    <span className="mt-0.5 block text-[9px] font-medium tracking-wide uppercase">
                      This week
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measurables.map((measurable) => (
              <tr className="border-b border-[#f5f0ec] last:border-0" key={measurable.id}>
                <th
                  className="sticky left-0 z-10 bg-white px-5 py-4 align-top"
                  scope="row"
                >
                  <span className="block text-xs font-semibold text-[#30261f]">
                    {measurable.name}
                  </span>
                  <span className="mt-1 block text-[11px] font-normal text-[#91867e]">
                    {goalLabel(measurable.goal, measurable.unit)}
                  </span>
                  <span className="mt-1 block text-[11px] font-normal text-[#b0a49b]">
                    Owner:{" "}
                    {members.find((member) => member.id === measurable.ownerId)
                      ?.name ?? "Unknown owner"}
                  </span>
                </th>
                {weeks.map((week) => {
                  const score = scores[measurable.id]?.[week] ?? null
                  const status = getScoreStatus(
                    measurable,
                    score,
                    week,
                    currentWeek
                  )
                  const key = `${measurable.id}:${week}`
                  const isEditing = editingKey === key
                  const canEditScore = canEdit
                  return (
                    <td className="px-1.5 py-2 text-center align-top" key={week}>
                      {isEditing ? (
                        <form
                          className="mx-auto flex w-[68px] flex-col items-center gap-1"
                          onSubmit={(event) =>
                            saveScore(event, measurable.id, week)
                          }
                        >
                          <input
                            aria-label={`${measurable.name}, week of ${formatWeek(week)} score`}
                            autoFocus
                            className="h-7 w-full rounded-md border border-[#dfc4ae] bg-white px-1 text-center text-xs text-[#30261f] outline-none focus:ring-2 focus:ring-[#c96a29]/20"
                            onChange={(event) =>
                              setEditingValue(event.target.value)
                            }
                            step="any"
                            type="number"
                            value={editingValue}
                          />
                          <div className="flex gap-1">
                            <Button
                              className="h-6 px-1.5 text-[10px]"
                              size="xs"
                              type="submit"
                            >
                              Save
                            </Button>
                            <button
                              className="h-6 px-1 text-[10px] text-[#756d67]"
                              onClick={() => setEditingKey(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <button
                            aria-label={
                              canEditScore
                                ? `Edit ${measurable.name}, week of ${formatWeek(week)}`
                                : `${measurable.name}, week of ${formatWeek(week)}`
                            }
                            className={`mx-auto inline-flex min-h-8 min-w-12 items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold ${
                              canEditScore
                                ? "hover:ring-1 hover:ring-[#e7ded6]"
                                : "cursor-default"
                            } ${statusStyle(status)}`}
                            disabled={!canEditScore}
                            onClick={() => {
                              if (canEditScore) beginEdit(measurable.id, week)
                            }}
                            title={canEditScore ? "Edit score" : undefined}
                            type="button"
                          >
                            {score === null ? "—" : score}
                            {canEditScore ? (
                              <PencilLine
                                aria-hidden="true"
                                className="size-2.5 opacity-50"
                              />
                            ) : null}
                          </button>
                          <span className="mx-auto mt-1 flex w-fit items-center gap-1 text-[9px] leading-3 text-[#91867e]">
                            <StatusIcon status={status} />
                            {status === "on_track"
                              ? "On track"
                              : status === "off_track"
                                ? "Off track"
                                : "Pending"}
                          </span>
                          {canEdit && status === "off_track" ? (
                            <button
                              className="mt-1 max-w-[74px] text-[9px] leading-3 font-semibold text-[#a64e16] underline decoration-[#e9c2a5] underline-offset-2 hover:text-[#873e10]"
                              onClick={() => void makeIssue(measurable, week)}
                              type="button"
                            >
                              Make it an Issue
                            </button>
                          ) : null}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#f1ebe6] px-5 py-3 text-[11px] text-[#91867e] sm:px-6">
        Scores are saved to the team workspace. Closed weeks without a score are off track;
        an unscored current week is pending.
      </p>
    </section>
  )
}
