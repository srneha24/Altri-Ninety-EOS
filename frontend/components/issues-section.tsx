"use client"

import { useMemo, useState, type SubmitEvent } from "react"
import { AlertTriangle, Check, ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectMenu } from "@/components/ui/select-menu"
import { useTeamWorkspace } from "@/components/team-workspace-provider"
import type { DemoIssue } from "@/lib/types"
import { useWorkspaceIdentity } from "@/lib/workspace-identity"

type IssuesSectionProps = {
  title?: string
}

function displayName(
  userId: string,
  members: { id: string; name: string }[]
): string {
  return members.find((user) => user.id === userId)?.name ?? "Unknown owner"
}

function formatCreatedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  })
}

function sourceDescription(
  issue: DemoIssue,
  measurables: { id: string; name: string }[] = []
): string | null {
  if (!issue.source) return null
  const measurable = measurables.find(
    (item) => item.id === issue.source?.measurableId
  )
  const date = new Date(`${issue.source.weekStart}T12:00:00Z`)
  return `${measurable?.name ?? "Measurable"} · week of ${date.toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" }
  )}`
}

function IssueCard({ issue }: { issue: DemoIssue }) {
  const workspace = useTeamWorkspace()
  const identity = useWorkspaceIdentity()
  const {
    selectedTeam,
    updateIssuePriority,
    solveIssue,
    addTodo,
  } = workspace
  const role = identity?.role ?? workspace.role
  const [resolutionNote, setResolutionNote] = useState("")
  const [todoTitle, setTodoTitle] = useState("")
  const [todoOwnerId, setTodoOwnerId] = useState("")
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [showSolveForm, setShowSolveForm] = useState(false)
  const [notice, setNotice] = useState("")
  const canWrite = role !== "observer"
  const { members, measurables } = workspace
  const owners = members.filter(
    (user) =>
      user.role !== "observer" && selectedTeam.memberIds.includes(user.id)
  )
  const isSolved = Boolean(issue.solvedAt)

  async function handleSolve(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = resolutionNote.trim()
    if (!note) return
    try {
      await solveIssue(issue.id, note)
      setShowSolveForm(false)
      setNotice("Issue solved.")
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to solve the Issue."
      )
    }
  }

  async function handleAddTodo(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = todoTitle.trim()
    const ownerId = todoOwnerId || owners[0]?.id
    if (!title || !ownerId) return
    try {
      const todo = await addTodo(title, ownerId, issue.id)
      setTodoTitle("")
      setShowTodoForm(false)
      setNotice(`To-Do added · due ${todo.dueDate}.`)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to add the To-Do."
      )
    }
  }

  return (
    <article className="rounded-xl border border-[#eee5de] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#30261f]">
              {issue.title}
            </h3>
            {issue.priority === 5 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                <AlertTriangle aria-hidden="true" className="size-3" />
                Highest
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-[#756d67]">
            Owner:{" "}
            <span className="font-medium">
              {displayName(issue.ownerId, members)}
            </span>
            <span className="px-1.5 text-[#d3c7be]">·</span>
            Created {formatCreatedAt(issue.createdAt)}
          </p>
          {sourceDescription(issue, measurables) ? (
            <p className="mt-1 text-[11px] text-[#9b4d18]">
              Source: {sourceDescription(issue, measurables)}
            </p>
          ) : null}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-[#756d67]">
          Priority
          <SelectMenu
            ariaLabel={`Priority for ${issue.title}`}
            className="h-8 min-w-28 rounded-lg px-2 text-xs"
            disabled={!canWrite || isSolved}
            onChange={(value) => {
              void Promise.resolve(
                updateIssuePriority(issue.id, value ? Number(value) : null)
              ).catch((error: unknown) =>
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "Unable to update the Issue."
                )
              )
            }}
            options={[
              { value: "", label: "No priority" },
              ...[5, 4, 3, 2, 1].map((priority) => ({
                value: String(priority),
                label: String(priority),
              })),
            ]}
            value={issue.priority === null ? "" : String(issue.priority)}
          />
        </label>
      </div>

      {isSolved ? (
        <div className="mt-4 rounded-lg bg-emerald-50/70 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-900">
            <Check aria-hidden="true" className="size-3.5" />
            Solved {issue.solvedAt ? formatCreatedAt(issue.solvedAt) : ""}
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/80">
            {issue.resolutionNote}
          </p>
        </div>
      ) : canWrite ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            className="h-8 rounded-lg border-[#e7ded6] text-xs text-[#6f5140]"
            onClick={() => {
              setShowTodoForm((open) => !open)
              setShowSolveForm(false)
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Add a To-Do
          </Button>
          <Button
            className="h-8 rounded-lg text-xs"
            onClick={() => {
              setShowSolveForm((open) => !open)
              setShowTodoForm(false)
            }}
            size="sm"
            type="button"
          >
            Solve Issue
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-[11px] font-medium text-[#91867e]">
          Read only
        </p>
      )}

      {showTodoForm && canWrite ? (
        <form
          className="mt-4 grid gap-3 rounded-xl border border-[#eee5de] bg-[#fcfaf8] p-3 sm:grid-cols-[1fr_180px_auto]"
          onSubmit={handleAddTodo}
        >
          <label className="space-y-1 text-[11px] font-medium text-[#756d67]">
            To-Do title
            <input
              className="h-9 w-full rounded-lg border border-[#e7ded6] bg-white px-3 text-xs text-[#30261f] outline-none focus:border-[#c96a29]"
              onChange={(event) => setTodoTitle(event.target.value)}
              placeholder="Describe the next step"
              required
              value={todoTitle}
            />
          </label>
          <label className="space-y-1 text-[11px] font-medium text-[#756d67]">
            Owner
            <SelectMenu
              ariaLabel="To-Do owner"
              className="h-9 w-full rounded-lg px-2 text-xs"
              onChange={setTodoOwnerId}
              options={owners.map((owner) => ({
                value: owner.id,
                label: owner.name,
              }))}
              value={todoOwnerId || owners[0]?.id || ""}
            />
          </label>
          <Button className="mt-auto h-9 rounded-lg text-xs" type="submit">
            Add
          </Button>
        </form>
      ) : null}

      {showSolveForm && canWrite ? (
        <form
          className="mt-4 flex flex-col gap-2 rounded-xl border border-[#eee5de] bg-[#fcfaf8] p-3 sm:flex-row"
          onSubmit={handleSolve}
        >
          <label className="sr-only" htmlFor={`resolution-${issue.id}`}>
            Resolution note
          </label>
          <input
            className="h-9 min-w-0 flex-1 rounded-lg border border-[#e7ded6] bg-white px-3 text-xs text-[#30261f] outline-none focus:border-[#c96a29]"
            id={`resolution-${issue.id}`}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Required resolution note"
            required
            value={resolutionNote}
          />
          <Button className="h-9 rounded-lg text-xs" type="submit">
            Confirm solve
          </Button>
        </form>
      ) : null}

      {notice ? (
        <p aria-live="polite" className="mt-2 text-[11px] text-[#8a5836]">
          {notice}
        </p>
      ) : null}
    </article>
  )
}

export function IssuesSection({ title = "Issues" }: IssuesSectionProps) {
  const workspace = useTeamWorkspace()
  const identity = useWorkspaceIdentity()
  const { currentUser, issues, createIssue, members } = workspace
  const role = identity?.role ?? workspace.role
  const [showSolved, setShowSolved] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newPriority, setNewPriority] = useState("3")
  const [notice, setNotice] = useState("")
  const canWrite = role !== "observer"

  const sortedIssues = useMemo(
    () =>
      issues
        .filter((issue) => Boolean(issue.solvedAt) === showSolved)
        .sort((left, right) => {
          if (left.priority === null && right.priority !== null) return 1
          if (left.priority !== null && right.priority === null) return -1
          if (left.priority !== right.priority) {
            return (right.priority ?? 0) - (left.priority ?? 0)
          }
          return left.createdAt.localeCompare(right.createdAt)
        }),
    [issues, showSolved]
  )

  async function handleCreateIssue(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const priority = newPriority === "" ? null : Number(newPriority)
    try {
      const issue = await createIssue(title, priority)
      setNewTitle("")
      setShowCreateForm(false)
      setNotice(
        `Issue added and assigned to ${displayName(currentUser.id, members)}.`
      )
      if (issue.solvedAt) {
        setShowSolved(true)
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to create the Issue."
      )
    }
  }

  return (
    <section
      aria-labelledby="issues-title"
      className="overflow-visible rounded-2xl border border-[#eee5de] bg-white shadow-sm shadow-[#3d2517]/[0.025]"
    >
      <div className="flex flex-col gap-3 border-b border-[#f1ebe6] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2
            className="text-base font-semibold tracking-[-0.02em] text-[#30261f]"
            id="issues-title"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-[#91867e]">
            {showSolved ? "Solved Issues" : "Unsolved · highest priority first"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-pressed={showSolved}
            className="h-9 rounded-lg border-[#e7ded6] text-xs text-[#6f5140]"
            onClick={() => setShowSolved((value) => !value)}
            size="sm"
            type="button"
            variant="outline"
          >
            {showSolved ? "View unsolved" : "View solved"}
            <ChevronDown
              aria-hidden="true"
              className={`ml-1 size-3.5 transition-transform ${showSolved ? "rotate-180" : ""}`}
            />
          </Button>
          {canWrite && !showSolved ? (
            <Button
              className="h-9 rounded-lg bg-[#a64e16] text-xs text-white hover:bg-[#873e10]"
              onClick={() => setShowCreateForm((value) => !value)}
              size="sm"
              type="button"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Create Issue
            </Button>
          ) : null}
        </div>
      </div>

      {showCreateForm ? (
        <form
          className="grid gap-3 border-b border-[#f1ebe6] bg-[#fcfaf8] px-5 py-4 sm:grid-cols-[1fr_150px_auto] sm:px-6"
          onSubmit={handleCreateIssue}
        >
          <label className="space-y-1 text-[11px] font-medium text-[#756d67]">
            Issue title
            <input
              className="h-10 w-full rounded-lg border border-[#e7ded6] bg-white px-3 text-sm text-[#30261f] outline-none focus:border-[#c96a29]"
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="What is getting in the way?"
              required
              value={newTitle}
            />
          </label>
          <label className="space-y-1 text-[11px] font-medium text-[#756d67]">
            Priority
            <SelectMenu
              ariaLabel="New issue priority"
              className="h-10 w-full rounded-lg px-3 text-sm"
              onChange={setNewPriority}
              options={[
                { value: "", label: "No priority" },
                ...[5, 4, 3, 2, 1].map((priority) => ({
                  value: String(priority),
                  label: String(priority),
                })),
              ]}
              value={newPriority}
            />
          </label>
          <Button className="mt-auto h-10 rounded-lg text-xs" type="submit">
            Add Issue
          </Button>
        </form>
      ) : null}

      {notice ? (
        <p
          aria-live="polite"
          className="border-b border-[#f1ebe6] bg-[#fff9f3] px-6 py-2.5 text-xs text-[#8a5836]"
        >
          {notice}
        </p>
      ) : null}

      <div className="space-y-3 p-4 sm:p-5">
        {sortedIssues.length ? (
          sortedIssues.map((issue) => (
            <IssueCard issue={issue} key={issue.id} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#e7ded6] px-5 py-8 text-center">
            <p className="text-sm font-medium text-[#53463d]">
              {showSolved ? "No solved Issues yet" : "No open Issues"}
            </p>
            <p className="mt-1 text-xs text-[#91867e]">
              {showSolved
                ? "Resolved Issues will appear here with their note."
                : "This list is clear for now."}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
