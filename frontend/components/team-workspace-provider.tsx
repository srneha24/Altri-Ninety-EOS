"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  createIssue as createIssueRequest,
  createTodo as createTodoRequest,
  getActiveMeeting,
  getIssues,
  getQuarterlyRocks,
  getScorecard,
  getTeamMembers,
  getTodos,
  updateIssue,
  updateScore as updateScoreRequest,
  updateTodo,
  upsertScore as upsertScoreRequest,
  type ApiIssue,
  type ApiMember,
  type ApiMeasurable,
  type ApiRock,
  type ApiTodo,
} from "@/lib/api"
import { ApiError } from "@/lib/api-client"
import { getAccessToken, refreshSession } from "@/lib/auth"
import { readMeetingEventStream } from "@/lib/meeting-sse"
import {
  APP_NOW,
  type DemoIssue,
  type DemoMeasurable,
  type DemoRole,
  type DemoRock,
  type DemoTeam,
  type DemoTodo,
  type DemoUser,
} from "@/lib/types"

type TeamWorkspaceContextValue = {
  role: DemoRole
  currentUser: DemoUser
  teams: DemoTeam[]
  selectedTeam: DemoTeam
  selectedTeamId: string
  members: DemoUser[]
  loading: boolean
  loaded: boolean
  error: string | null
  refreshWorkspace: () => Promise<void>
  measurables: DemoMeasurable[]
  weeks: string[]
  today: string
  scores: Record<string, Record<string, number | null>>
  scoreIds: Record<string, Record<string, string>>
  updateScore: (
    measurableId: string,
    weekStart: string,
    score: number
  ) => Promise<void>
  issues: DemoIssue[]
  createIssue: (
    title: string,
    priority?: number | null,
    source?: DemoIssue["source"]
  ) => Promise<DemoIssue>
  updateIssuePriority: (
    issueId: string,
    priority: number | null
  ) => Promise<void>
  solveIssue: (issueId: string, note: string) => Promise<void>
  todos: DemoTodo[]
  addTodo: (
    title: string,
    ownerId: string,
    issueId: string
  ) => Promise<DemoTodo>
  toggleTodo: (todoId: string) => Promise<void>
  rocks: DemoRock[]
}

type TeamWorkspaceProviderProps = {
  user: DemoUser
  teams: DemoTeam[]
  selectedTeamId: string
  serverNow?: string
  children: ReactNode
}

const TeamWorkspaceContext = createContext<TeamWorkspaceContextValue | null>(
  null
)

function companyDateParts(nowIso?: string): {
  year: number
  month: number
  day: number
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(nowIso ?? APP_NOW))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function mondayOf(date: string): string {
  const value = new Date(`${date}T12:00:00Z`)
  const daysSinceMonday = (value.getUTCDay() + 6) % 7
  value.setUTCDate(value.getUTCDate() - daysSinceMonday)
  return value.toISOString().slice(0, 10)
}

function getTeamDates(nowIso?: string): { today: string; weeks: string[] } {
  const { year, month, day } = companyDateParts(nowIso)
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const currentWeek = mondayOf(today)
  return {
    today,
    weeks: Array.from({ length: 13 }, (_, index) =>
      addDays(currentWeek, (index - 12) * 7)
    ),
  }
}

function currentQuarter(nowIso?: string): string {
  const { year, month } = companyDateParts(nowIso)
  return `${year}-Q${Math.ceil(month / 3)}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

function mapMember(member: ApiMember): DemoUser {
  return { ...member, initials: initials(member.name) }
}

function mapIssue(issue: ApiIssue): DemoIssue {
  const source =
    issue.source?.measurable_id && issue.source.week_start
      ? {
          measurableId: issue.source.measurable_id,
          weekStart: issue.source.week_start,
        }
      : null
  return {
    id: issue.id,
    title: issue.title,
    ownerId: issue.owner.id,
    priority: issue.priority,
    createdAt: issue.created_at,
    source,
    solvedAt: issue.solved_at,
    resolutionNote: issue.resolution_note,
  }
}

function mapTodo(todo: ApiTodo): DemoTodo {
  return {
    id: todo.id,
    title: todo.title,
    ownerId: todo.owner.id,
    dueDate: todo.due_date,
    doneAt: todo.done_at,
    issueId: todo.issue?.id ?? null,
    createdAt: todo.created_at,
  }
}

function mapRock(rock: ApiRock): DemoRock {
  return {
    id: rock.id,
    title: rock.title,
    ownerId: rock.owner.id,
    seededStatus: rock.status,
    milestones: rock.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      dueDate: milestone.due_date,
      done: milestone.done,
    })),
  }
}

function makeScoreMaps(measurables: ApiMeasurable[], weeks: string[]) {
  const scores: Record<string, Record<string, number | null>> = {}
  const scoreIds: Record<string, Record<string, string>> = {}

  for (const measurable of measurables) {
    scores[measurable.id] = Object.fromEntries(
      weeks.map((week) => [week, null])
    )
    scoreIds[measurable.id] = {}
    for (const score of measurable.scores) {
      scores[measurable.id][score.week_start] = score.value
      scoreIds[measurable.id][score.week_start] = score.id
    }
  }

  return { scores, scoreIds }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The request failed."
}

async function loadTeamData(teamId: string, nowIso?: string) {
  const dates = getTeamDates(nowIso)
  const [members, scorecard, issues, todos, rocks] = await Promise.all([
    getTeamMembers(teamId),
    getScorecard(teamId, dates.weeks[0], dates.weeks[12]),
    getIssues(teamId),
    getTodos(teamId),
    getQuarterlyRocks(teamId, currentQuarter(nowIso)),
  ])
  return { dates, members, scorecard, issues, todos, rocks }
}

export function TeamWorkspaceProvider({
  user,
  teams,
  selectedTeamId,
  serverNow,
  children,
}: TeamWorkspaceProviderProps) {
  const [members, setMembers] = useState<DemoUser[]>([])
  const [measurables, setMeasurables] = useState<DemoMeasurable[]>([])
  const [weeks, setWeeks] = useState<string[]>([])
  const [today, setToday] = useState("")
  const [scores, setScores] = useState<
    Record<string, Record<string, number | null>>
  >({})
  const [scoreIds, setScoreIds] = useState<
    Record<string, Record<string, string>>
  >({})
  const [issues, setIssues] = useState<DemoIssue[]>([])
  const [todos, setTodos] = useState<DemoTodo[]>([])
  const [rocks, setRocks] = useState<DemoRock[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? null

  const applyLoadedData = useCallback(
    (data: Awaited<ReturnType<typeof loadTeamData>>) => {
      const {
        dates,
        members: apiMembers,
        scorecard,
        issues: apiIssues,
        todos: apiTodos,
        rocks: apiRocks,
      } = data
      const mappedMembers = apiMembers.map(mapMember)
      const { scores: scoreValues, scoreIds: ids } = makeScoreMaps(
        scorecard,
        dates.weeks
      )
      setMembers(mappedMembers)
      setWeeks(dates.weeks)
      setToday(dates.today)
      setMeasurables(
        scorecard.map((measurable) => ({
          id: measurable.id,
          name: measurable.name,
          ownerId: measurable.owner.id,
          unit: measurable.unit,
          goal: measurable.goal,
        }))
      )
      setScores(scoreValues)
      setScoreIds(ids)
      setIssues(apiIssues.map(mapIssue))
      setTodos(apiTodos.map(mapTodo))
      setRocks(apiRocks.map(mapRock))
      setLoaded(true)
      setLoading(false)
    },
    []
  )

  const refreshWorkspace = useCallback(async () => {
    if (!selectedTeam) return
    // A refresh must supersede every prior load. In particular, this prevents
    // an older request which started before another attendee changed an Issue
    // from overwriting the newer, SSE-triggered response when it finishes.
    const request = ++requestId.current
    try {
      const data = await loadTeamData(selectedTeam.id, serverNow)
      if (request !== requestId.current) return
      applyLoadedData(data)
    } catch (refreshError) {
      if (request !== requestId.current) return
      setError(getErrorMessage(refreshError))
    }
  }, [applyLoadedData, selectedTeam, serverNow])

  useEffect(() => {
    if (!selectedTeam) return

    const request = ++requestId.current
    void Promise.resolve()
      .then(() => {
        if (request !== requestId.current) return null
        setLoading(true)
        setLoaded(false)
        setError(null)
        return loadTeamData(selectedTeam.id, serverNow)
      })
      .then((data) => {
        if (!data) return
        if (request !== requestId.current) return
        applyLoadedData(data)
      })
      .catch((loadError: unknown) => {
        if (request !== requestId.current) return
        setError(getErrorMessage(loadError))
        setLoading(false)
      })

    return () => {
      requestId.current += 1
    }
  }, [applyLoadedData, selectedTeam, serverNow])

  // Refresh workspace data when the tab regains visibility so that changes
  // made by other users (e.g. an Issue solved in a meeting) are picked up even
  // if the SSE workspace_updated event was missed while the tab was hidden.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshWorkspace()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )
  }, [refreshWorkspace])

  // The workspace is mounted for both the Team and Meeting routes. Keep the
  // meeting stream here (rather than only on the Meeting page) so every open
  // workspace for this team receives changes made by another attendee.
  useEffect(() => {
    if (!selectedTeam) return

    // Capture the narrowed value before the asynchronous callback. State may
    // change while the stream is reconnecting, so TypeScript cannot preserve
    // the outer null check inside `connect`.
    const teamId = selectedTeam.id

    const controller = new AbortController()
    let retry: number | undefined

    const reconnect = (delay: number) => {
      if (!controller.signal.aborted) {
        retry = window.setTimeout(() => void connect(), delay)
      }
    }

    async function connect(): Promise<void> {
      try {
        const activeMeeting = await getActiveMeeting(teamId)
        // Close the discovery-to-subscription gap with a fresh snapshot. Any
        // subsequent mutation is delivered by the stream below.
        void refreshWorkspace()
        let token = getAccessToken()
        if (!token) {
          token = (await refreshSession()).access_token
        }

        await readMeetingEventStream(
          teamId,
          activeMeeting.id,
          token,
          controller.signal,
          {
            onMeetingState: () => undefined,
            onWorkspaceUpdated: () => void refreshWorkspace(),
            onUnavailable: () => undefined,
          }
        )
        reconnect(1000)
      } catch (streamError) {
        if (controller.signal.aborted) return
        // No active meeting is an expected steady state. Poll lightly so a
        // tab already open on Team joins the stream when one starts.
        reconnect(
          streamError instanceof ApiError && streamError.status === 404
            ? 1000
            : 3000
        )
      }
    }

    void connect()
    return () => {
      controller.abort()
      if (retry) window.clearTimeout(retry)
    }
  }, [refreshWorkspace, selectedTeam])

  const withMutationError = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      try {
        const result = await action()
        setError(null)
        return result
      } catch (mutationError) {
        setError(getErrorMessage(mutationError))
        throw mutationError
      }
    },
    []
  )

  const updateScore = useCallback(
    (measurableId: string, weekStart: string, value: number) =>
      withMutationError(async () => {
        const scoreId = scoreIds[measurableId]?.[weekStart]
        const saved = scoreId
          ? await updateScoreRequest(selectedTeamId, scoreId, value)
          : await upsertScoreRequest(
              selectedTeamId,
              measurableId,
              weekStart,
              value
            )
        setScores((previous) => ({
          ...previous,
          [measurableId]: { ...previous[measurableId], [weekStart]: value },
        }))
        setScoreIds((previous) => ({
          ...previous,
          [measurableId]: {
            ...previous[measurableId],
            [weekStart]: saved.id,
          },
        }))
      }),
    [scoreIds, selectedTeamId, withMutationError]
  )

  const createIssue = useCallback(
    (title: string, priority: number | null = 3, source?: DemoIssue["source"]) =>
      withMutationError(async () => {
        const issue = await createIssueRequest(selectedTeamId, {
          title: source ? undefined : title,
          priority,
          source: source
            ? {
                measurable_id: source.measurableId,
                week_start: source.weekStart,
              }
            : undefined,
        })
        const mapped = mapIssue(issue)
        setIssues((previous) => {
          const existingIndex = previous.findIndex(
            (existing) => existing.id === mapped.id
          )
          if (existingIndex === -1) return [mapped, ...previous]
          return previous.map((existing, index) =>
            index === existingIndex ? mapped : existing
          )
        })
        return mapped
      }),
    [selectedTeamId, withMutationError]
  )

  const updateIssuePriority = useCallback(
    (issueId: string, priority: number | null) =>
      withMutationError(async () => {
        const updated = mapIssue(
          await updateIssue(selectedTeamId, issueId, { priority })
        )
        setIssues((previous) =>
          previous.map((issue) => (issue.id === issueId ? updated : issue))
        )
      }),
    [selectedTeamId, withMutationError]
  )

  const solveIssue = useCallback(
    (issueId: string, note: string) =>
      withMutationError(async () => {
        const updated = mapIssue(
          await updateIssue(selectedTeamId, issueId, {
            resolution_note: note,
          })
        )
        setIssues((previous) =>
          previous.map((issue) => (issue.id === issueId ? updated : issue))
        )
      }),
    [selectedTeamId, withMutationError]
  )

  const addTodo = useCallback(
    (title: string, ownerId: string, issueId: string) =>
      withMutationError(async () => {
        const created = mapTodo(
          await createTodoRequest(selectedTeamId, {
            title,
            owner_id: ownerId,
            source_issue_id: issueId || undefined,
          })
        )
        setTodos((previous) => [created, ...previous])
        return created
      }),
    [selectedTeamId, withMutationError]
  )

  const toggleTodo = useCallback(
    (todoId: string) => {
      const todo = todos.find((item) => item.id === todoId)
      if (!todo) {
        return Promise.reject(new Error("To-Do not found."))
      }
      return withMutationError(async () => {
        const updated = mapTodo(
          await updateTodo(selectedTeamId, todoId, !todo.doneAt)
        )
        setTodos((previous) =>
          previous.map((item) => (item.id === todoId ? updated : item))
        )
      })
    },
    [selectedTeamId, todos, withMutationError]
  )

  const selectedTeamWithMembers = useMemo(
    () =>
      selectedTeam
        ? { ...selectedTeam, memberIds: members.map((member) => member.id) }
        : { id: "", name: "", memberIds: [] },
    [members, selectedTeam]
  )

  const contextValue = useMemo<TeamWorkspaceContextValue>(
    () => ({
      role: user.role,
      currentUser: user,
      teams,
      selectedTeam: selectedTeamWithMembers,
      selectedTeamId,
      members,
      loading,
      loaded,
      error,
      refreshWorkspace,
      measurables,
      weeks,
      today,
      scores,
      scoreIds,
      updateScore,
      issues,
      createIssue,
      updateIssuePriority,
      solveIssue,
      todos,
      addTodo,
      toggleTodo,
      rocks,
    }),
    [
      addTodo,
      createIssue,
      error,
      issues,
      loading,
      loaded,
      members,
      measurables,
      refreshWorkspace,
      rocks,
      scoreIds,
      scores,
      selectedTeamId,
      selectedTeamWithMembers,
      solveIssue,
      teams,
      todos,
      toggleTodo,
      updateIssuePriority,
      updateScore,
      user,
      weeks,
      today,
    ]
  )

  if (!selectedTeam) {
    return (
      <TeamWorkspaceContext.Provider
        value={{
          role: user.role,
          currentUser: user,
          teams,
          selectedTeam: { id: "", name: "", memberIds: [] },
          selectedTeamId,
          members: [],
          loading: false,
          loaded: false,
          error: "No team is available for this account.",
          refreshWorkspace: async () => undefined,
          measurables: [],
          weeks: [],
          today: "",
          scores: {},
          scoreIds: {},
          updateScore,
          issues: [],
          createIssue,
          updateIssuePriority,
          solveIssue,
          todos: [],
          addTodo,
          toggleTodo,
          rocks: [],
        }}
      >
        {children}
      </TeamWorkspaceContext.Provider>
    )
  }

  return (
    <TeamWorkspaceContext.Provider value={contextValue}>
      {children}
    </TeamWorkspaceContext.Provider>
  )
}

export function useOptionalTeamWorkspace():
  | TeamWorkspaceContextValue
  | null {
  return useContext(TeamWorkspaceContext)
}

export function useTeamWorkspace(): TeamWorkspaceContextValue {
  const context = useOptionalTeamWorkspace()
  if (!context) {
    throw new Error("useTeamWorkspace must be used within TeamWorkspaceProvider.")
  }
  return context
}
