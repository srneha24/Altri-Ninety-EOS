"use client"

import { useMemo } from "react"
import { Check, Circle, Clock3, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDemoWorkspace } from "@/components/demo-workspace-provider"
import { DEMO_ISSUES, DEMO_TODAY, DEMO_USERS } from "@/lib/demo-data"

const LAST_CLOSED_WEEK_START = "2026-11-16"
const LAST_CLOSED_WEEK_END = "2026-11-22"

function todoOwnerName(ownerId: string): string {
  return DEMO_USERS.find((user) => user.id === ownerId)?.name ?? "Unknown owner"
}

function shortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function issueTitle(issueId: string | null): string | null {
  if (!issueId) return null
  return DEMO_ISSUES.find((issue) => issue.id === issueId)?.title ?? null
}

export function TodosSection() {
  const { todos, role, toggleTodo } = useDemoWorkspace()
  const canWrite = role !== "observer"

  const completion = useMemo(() => {
    const dueLastWeek = todos.filter(
      (todo) =>
        todo.dueDate >= LAST_CLOSED_WEEK_START &&
        todo.dueDate <= LAST_CLOSED_WEEK_END
    )
    if (dueLastWeek.length === 0) return null
    const doneByEnd = dueLastWeek.filter(
      (todo) =>
        todo.doneAt !== null &&
        todo.doneAt.slice(0, 10) <= LAST_CLOSED_WEEK_END
    ).length
    return Math.floor((doneByEnd / dueLastWeek.length) * 100 + 0.5)
  }, [todos])

  return (
    <section
      aria-labelledby="todos-title"
      className="overflow-hidden rounded-2xl border border-[#eee5de] bg-white shadow-sm shadow-[#3d2517]/[0.025]"
    >
      <div className="flex flex-col gap-3 border-b border-[#f1ebe6] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2
            className="text-base font-semibold tracking-[-0.02em] text-[#30261f]"
            id="todos-title"
          >
            To-Dos
          </h2>
          <p className="mt-1 text-xs text-[#91867e]">
            Follow-through with a clear owner and due date
          </p>
        </div>
        <div className="rounded-xl bg-[#fcfaf8] px-3.5 py-2.5">
          <p className="text-[10px] font-medium tracking-wide text-[#91867e] uppercase">
            Last closed week · Nov 16–22
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#30261f]">
            {completion === null ? "No To-Dos due" : `${completion}% complete`}
            {completion !== null ? (
              <span
                className={`ml-2 text-[10px] font-semibold ${
                  completion >= 90 ? "text-emerald-700" : "text-[#a64e16]"
                }`}
              >
                {completion >= 90 ? "On target · 90%" : "Target · 90%"}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#f5f0ec]">
        {todos.map((todo) => {
          const overdue = !todo.doneAt && todo.dueDate < DEMO_TODAY
          const linkedIssue = issueTitle(todo.issueId)
          return (
            <article
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              key={todo.id}
            >
              <div className="flex min-w-0 items-start gap-3">
                {todo.doneAt ? (
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                ) : (
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#fcf2e9] text-[#a64e16]">
                    <Circle aria-hidden="true" className="size-3.5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      todo.doneAt
                        ? "text-[#91867e] line-through"
                        : "text-[#30261f]"
                    }`}
                  >
                    {todo.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#91867e]">
                    <span>Owner: {todoOwnerName(todo.ownerId)}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        overdue ? "font-semibold text-rose-700" : ""
                      }`}
                    >
                      {overdue ? (
                        <Clock3 aria-hidden="true" className="size-3" />
                      ) : null}
                      Due {shortDate(todo.dueDate)}
                      {overdue ? " · Overdue" : ""}
                    </span>
                    {todo.doneAt ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Done {shortDate(todo.doneAt.slice(0, 10))}</span>
                      </>
                    ) : null}
                  </p>
                  {linkedIssue ? (
                    <p className="mt-1 truncate text-[11px] text-[#9b4d18]">
                      From Issue: {linkedIssue}
                    </p>
                  ) : null}
                </div>
              </div>
              {canWrite ? (
                <Button
                  aria-label={
                    todo.doneAt
                      ? `Undo completion: ${todo.title}`
                      : `Mark done: ${todo.title}`
                  }
                  className="h-8 shrink-0 self-start rounded-lg border-[#e7ded6] text-xs text-[#6f5140] sm:self-center"
                  onClick={() => toggleTodo(todo.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {todo.doneAt ? (
                    <>
                      <Undo2 aria-hidden="true" className="size-3.5" />
                      Undo
                    </>
                  ) : (
                    <>
                      <Check aria-hidden="true" className="size-3.5" />
                      Mark done
                    </>
                  )}
                </Button>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
