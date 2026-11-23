"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  Play,
  Star,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDemoWorkspace } from "@/components/demo-workspace-provider"
import { IssuesSection } from "@/components/issues-section"
import { ScorecardSection, getScoreStatus } from "@/components/scorecard-section"
import {
  DEMO_ENDED_MEETINGS,
  DEMO_USERS,
  MEETING_AGENDA,
  type MeetingSection,
} from "@/lib/demo-data"

function personName(userId: string): string {
  return DEMO_USERS.find((person) => person.id === userId)?.name ?? "Unknown"
}

function formatDuration(seconds: number): string {
  const absolute = Math.abs(seconds)
  const minutes = Math.floor(absolute / 60)
    .toString()
    .padStart(2, "0")
  const remainder = (absolute % 60).toString().padStart(2, "0")
  return `${seconds < 0 ? "+" : ""}${minutes}:${remainder}`
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function MeetingPage() {
  const {
    role,
    currentUser,
    meeting,
    startMeeting,
    joinMeeting,
    advanceMeeting,
    endMeeting,
    submitRating,
    measurables,
    weeks,
    scores,
    issues,
    todos,
  } = useDemoWorkspace()
  const [now, setNow] = useState(0)
  const section = meeting
    ? (MEETING_AGENDA.find((item) => item.id === meeting.section) ??
      MEETING_AGENDA[0])
    : MEETING_AGENDA[0]
  const active = meeting?.status === "active"
  const isFacilitator = meeting?.facilitatorId === currentUser.id
  const isAttending = meeting?.attendees.includes(currentUser.id) ?? false

  useEffect(() => {
    if (!active) return
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [active, meeting?.sectionStartedAt])

  const secondsLeft = active
    ? Math.ceil(
        (section.durationMinutes * 60_000 -
          (now === 0 ? 0 : now - meeting.sectionStartedAt)) /
          1000
      )
    : section.durationMinutes * 60
  const overtime = active && secondsLeft <= 0
  const averageRating = useMemo(() => {
    if (!meeting) return null
    const ratings = Object.values(meeting.ratings)
    if (!ratings.length) return null
    return Math.round(
      (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10
    ) / 10
  }, [meeting])
  const meetingTodos = useMemo(
    () =>
      meeting
        ? todos.filter((todo) => meeting.createdTodoIds.includes(todo.id))
        : [],
    [meeting, todos]
  )
  const solvedIssues = useMemo(
    () =>
      meeting
        ? issues.filter((issue) => meeting.solvedIssueIds.includes(issue.id))
        : [],
    [issues, meeting]
  )
  const lastClosedWeek = weeks[weeks.length - 2]
  const currentWeek = weeks[weeks.length - 1]

  if (!meeting) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#eee5de] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#9b4d18] uppercase">
                Weekly Level 10
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#30261f]">
                Make space for what matters.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#756d67]">
                Review the Scorecard, identify and solve Issues, then conclude
                with clear To-Dos and a meeting rating.
              </p>
            </div>
            {role !== "observer" ? (
              <Button
                className="h-11 shrink-0 rounded-xl bg-[#a64e16] px-5 text-white hover:bg-[#873e10]"
                onClick={startMeeting}
                type="button"
              >
                <Play aria-hidden="true" className="size-4" />
                Start Level 10
              </Button>
            ) : (
              <p className="max-w-xs rounded-xl bg-[#fcfaf8] px-4 py-3 text-xs leading-5 text-[#756d67]">
                An Admin or Team Member can start the meeting. Observers can
                join when it is active.
              </p>
            )}
          </div>
        </section>
        <AgendaCards currentSection={null} />
        <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-[#30261f]">
            Recent ended meetings
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {DEMO_ENDED_MEETINGS.map((endedMeeting) => {
              const ratings = Object.values(endedMeeting.ratings)
              const average = ratings.length
                ? Math.round(
                    (ratings.reduce((sum, rating) => sum + rating, 0) /
                      ratings.length) *
                      10
                  ) / 10
                : null
              return (
                <article
                  className="rounded-xl border border-[#f1ebe6] bg-[#fcfaf8] p-4"
                  key={endedMeeting.id}
                >
                  <p className="text-xs font-semibold text-[#30261f]">
                    Level 10 · {formatTimestamp(endedMeeting.endedAt)}
                  </p>
                  <p className="mt-2 text-[11px] text-[#756d67]">
                    {endedMeeting.attendees.length} attendees ·{" "}
                    {average === null ? "No rating" : `${average.toFixed(1)} average`}
                  </p>
                  <p className="mt-1 text-[11px] text-[#91867e]">
                    {endedMeeting.solvedIssueIds.length} Issues solved ·{" "}
                    {endedMeeting.createdTodoIds.length} To-Dos created
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  if (meeting.status === "ended") {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#eee5de] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <Check aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                Meeting complete
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#30261f]">
                Level 10 summary
              </h2>
              {meeting.endedAt ? (
                <p className="mt-1 text-xs text-[#91867e]">
                  Ended {formatTimestamp(meeting.endedAt)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#30261f]">
                Scorecard · week of{" "}
                {new Date(`${lastClosedWeek}T12:00:00Z`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", timeZone: "UTC" }
                )}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {measurables.map((measurable) => {
                  const score = scores[measurable.id]?.[lastClosedWeek] ?? null
                  const status = getScoreStatus(
                    measurable,
                    score,
                    lastClosedWeek,
                    currentWeek
                  )
                  return (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#fcfaf8] px-3 py-2.5"
                      key={measurable.id}
                    >
                      <span className="text-xs font-medium text-[#53463d]">
                        {measurable.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-[#756d67]">
                          {score === null ? "No score" : `${score} ${measurable.unit}`}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            status === "on_track"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          {status === "on_track" ? "On track" : "Off track"}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="space-y-6">
              <SummaryList
                emptyLabel="No Issues were solved in this meeting."
                items={solvedIssues.map((issue) => ({
                  id: issue.id,
                  title: issue.title,
                  detail: issue.resolutionNote ?? "",
                }))}
                title="Issues solved"
              />
              <SummaryList
                emptyLabel="No To-Dos were added during this meeting."
                items={meetingTodos.map((todo) => ({
                  id: todo.id,
                  title: todo.title,
                  detail: `${personName(todo.ownerId)} · due ${todo.dueDate}`,
                }))}
                title="To-Dos created"
              />
            </div>
          </div>
        </section>
        <MeetingRatingSummary
          attendees={meeting.attendees}
          averageRating={averageRating}
          ratings={meeting.ratings}
        />
        {role !== "observer" ? (
          <Button
            className="rounded-lg bg-[#a64e16] text-white hover:bg-[#873e10]"
            onClick={startMeeting}
            type="button"
          >
            <Play aria-hidden="true" className="size-4" />
            Start another meeting
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#eee5de] bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-[#f1ebe6] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                Meeting in progress
              </span>
              {isFacilitator ? (
                <span className="rounded-full bg-[#fcf2e9] px-2 py-0.5 text-[10px] font-semibold text-[#9b4d18]">
                  You are facilitating
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[#30261f]">
              {section.label}
            </h2>
            <p className="mt-1 text-xs text-[#91867e]">
              Facilitator: {personName(meeting.facilitatorId)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`min-w-32 rounded-xl px-4 py-2.5 text-center ${
                overtime ? "bg-rose-50 text-rose-800" : "bg-[#fcfaf8] text-[#30261f]"
              }`}
            >
              <p className="text-[10px] font-medium tracking-wide uppercase">
                {overtime ? "Over time" : "Section timer"}
              </p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">
                {formatDuration(secondsLeft)}
              </p>
            </div>
            {!isAttending ? (
              <Button
                className="h-10 rounded-lg border-[#e7ded6] text-xs text-[#6f5140]"
                onClick={joinMeeting}
                type="button"
                variant="outline"
              >
                <Users aria-hidden="true" className="size-3.5" />
                Join meeting
              </Button>
            ) : null}
            {isFacilitator ? (
              <>
                {meeting.section !== "conclude" ? (
                  <Button
                    className="h-10 rounded-lg bg-[#a64e16] px-4 text-xs text-white hover:bg-[#873e10]"
                    onClick={advanceMeeting}
                    type="button"
                  >
                    Advance agenda
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Button>
                ) : null}
                <Button
                  className="h-10 rounded-lg border-rose-200 text-xs text-rose-800 hover:bg-rose-50"
                  onClick={endMeeting}
                  type="button"
                  variant="outline"
                >
                  End meeting
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_260px]">
          <AgendaCards currentSection={meeting.section} />
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[#53463d]">
              <Users aria-hidden="true" className="size-3.5 text-[#9b4d18]" />
              Attendees · {meeting.attendees.length}
            </h3>
            <ul className="mt-3 space-y-2">
              {meeting.attendees.map((attendeeId) => {
                const attendee = DEMO_USERS.find(
                  (user) => user.id === attendeeId
                )
                return (
                  <li
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#fcfaf8] px-3 py-2"
                    key={attendeeId}
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-full bg-[#f7e5d7] text-[9px] font-semibold text-[#8e4214]">
                        {attendee?.initials ?? "?"}
                      </span>
                      <span className="text-xs font-medium text-[#53463d]">
                        {personName(attendeeId)}
                      </span>
                    </span>
                    {meeting.ratings[attendeeId] ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9b4d18]">
                        <Star aria-hidden="true" className="size-3 fill-current" />
                        {meeting.ratings[attendeeId]}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {meeting.section === "conclude" ? (
              <div className="mt-5 border-t border-[#f1ebe6] pt-4">
                <h3 className="text-xs font-semibold text-[#53463d]">
                  Rate this meeting
                </h3>
                {role !== "observer" && isAttending ? (
                  <div
                    aria-label="Meeting rating from 1 to 10"
                    className="mt-2 flex flex-wrap gap-1.5"
                    role="group"
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(
                      (rating) => (
                        <button
                          aria-label={`Rate ${rating} out of 10`}
                          aria-pressed={
                            meeting.ratings[currentUser.id] === rating
                          }
                          className={`grid size-7 place-items-center rounded-md text-[11px] font-semibold ${
                            meeting.ratings[currentUser.id] === rating
                              ? "bg-[#a64e16] text-white"
                              : "bg-[#fcfaf8] text-[#756d67] hover:bg-[#f7e5d7] hover:text-[#8e4214]"
                          }`}
                          key={rating}
                          onClick={() => submitRating(rating)}
                          type="button"
                        >
                          {rating}
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-[#91867e]">
                    Observers can join but cannot rate the meeting.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {meeting.section === "scorecard" ? <ScorecardSection /> : null}
      {meeting.section === "ids" ? <IssuesSection /> : null}
      {meeting.section === "conclude" ? (
        <ConcludeSection
          averageRating={averageRating}
          todos={meetingTodos}
        />
      ) : null}
    </div>
  )
}

function AgendaCards({
  currentSection,
}: {
  currentSection: MeetingSection | null
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {MEETING_AGENDA.map((item, index) => {
        const currentIndex = currentSection
          ? MEETING_AGENDA.findIndex(
              (agendaItem) => agendaItem.id === currentSection
            )
          : -1
        const active = item.id === currentSection
        const complete = currentIndex > index
        return (
          <div
            className={`rounded-xl border p-4 ${
              active
                ? "border-[#e8bd9e] bg-[#fff9f3]"
                : complete
                  ? "border-emerald-100 bg-emerald-50/60"
                  : "border-[#f1ebe6] bg-white"
            }`}
            key={item.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-[#a64e16] text-white"
                    : complete
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#f5f0ec] text-[#756d67]"
                }`}
              >
                {complete ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <span className="text-[10px] font-medium text-[#91867e]">
                {item.durationMinutes} min
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#30261f]">
              {item.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function ConcludeSection({
  averageRating,
  todos,
}: {
  averageRating: number | null
  todos: ReturnType<typeof useDemoWorkspace>["todos"]
}) {
  return (
    <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#30261f]">Conclude</h2>
          <p className="mt-1 text-xs text-[#91867e]">
            Recap this meeting&apos;s new To-Dos and the team rating.
          </p>
        </div>
        <p className="rounded-lg bg-[#fcfaf8] px-3 py-2 text-xs text-[#756d67]">
          Average rating{" "}
          <strong className="font-semibold text-[#30261f]">
            {averageRating === null ? "Not rated" : `${averageRating.toFixed(1)} / 10`}
          </strong>
        </p>
      </div>
      {todos.length ? (
        <ul className="mt-4 divide-y divide-[#f1ebe6] rounded-xl border border-[#f1ebe6]">
          {todos.map((todo) => (
            <li
              className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={todo.id}
            >
              <span className="text-xs font-medium text-[#30261f]">
                {todo.title}
              </span>
              <span className="text-[11px] text-[#91867e]">
                {personName(todo.ownerId)} · due {todo.dueDate}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-[#e7ded6] px-4 py-5 text-center text-xs text-[#91867e]">
          To-Dos added to Issues during this meeting will appear here.
        </p>
      )}
    </section>
  )
}

function SummaryList({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: { id: string; title: string; detail: string }[]
  emptyLabel: string
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#30261f]">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li className="rounded-lg bg-[#fcfaf8] px-3 py-2.5" key={item.id}>
              <p className="text-xs font-medium text-[#53463d]">{item.title}</p>
              <p className="mt-1 text-[11px] text-[#91867e]">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[#91867e]">{emptyLabel}</p>
      )}
    </div>
  )
}

function MeetingRatingSummary({
  attendees,
  ratings,
  averageRating,
}: {
  attendees: string[]
  ratings: Record<string, number>
  averageRating: number | null
}) {
  return (
    <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#30261f]">
            Attendees and ratings
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {attendees.map((attendeeId) => (
              <li
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fcfaf8] px-3 py-1.5 text-xs text-[#53463d]"
                key={attendeeId}
              >
                {personName(attendeeId)}
                {ratings[attendeeId] ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-[#9b4d18]">
                    <Star aria-hidden="true" className="size-3 fill-current" />
                    {ratings[attendeeId]}
                  </span>
                ) : (
                  <span className="text-[#a79a90]">Not rated</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-[#fff9f3] px-4 py-3 text-center">
          <p className="text-[10px] font-medium tracking-wide text-[#91867e] uppercase">
            Average rating
          </p>
          <p className="mt-1 text-xl font-semibold text-[#9b4d18]">
            {averageRating === null ? "—" : averageRating.toFixed(1)}
          </p>
        </div>
      </div>
    </section>
  )
}
