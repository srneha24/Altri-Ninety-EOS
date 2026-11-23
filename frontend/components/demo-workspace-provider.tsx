"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  DEMO_ISSUES,
  DEMO_MEASURABLES,
  DEMO_ROCKS,
  DEMO_SCORES,
  DEMO_TEAMS,
  DEMO_TODAY,
  DEMO_TODOS,
  DEMO_USERS,
  DEMO_WEEKS,
  type DemoIssue,
  type DemoMeeting,
  type DemoRole,
  type DemoTodo,
  type MeetingSection,
} from "@/lib/demo-data"

type DemoWorkspaceContextValue = {
  role: DemoRole
  currentUser: (typeof DEMO_USERS)[number]
  teams: typeof DEMO_TEAMS
  selectedTeamId: string
  selectedTeam: (typeof DEMO_TEAMS)[number]
  setRole: (role: DemoRole) => void
  setSelectedTeamId: (teamId: string) => void
  measurables: typeof DEMO_MEASURABLES
  weeks: string[]
  scores: Record<string, Record<string, number | null>>
  updateScore: (measurableId: string, weekStart: string, score: number) => void
  issues: DemoIssue[]
  createIssue: (
    title: string,
    priority?: number | null,
    source?: DemoIssue["source"]
  ) => DemoIssue
  updateIssuePriority: (issueId: string, priority: number | null) => void
  solveIssue: (issueId: string, note: string) => void
  todos: DemoTodo[]
  addTodo: (title: string, ownerId: string, issueId: string) => DemoTodo
  toggleTodo: (todoId: string) => void
  rocks: typeof DEMO_ROCKS
  meeting: DemoMeeting | null
  startMeeting: () => void
  joinMeeting: () => void
  advanceMeeting: () => void
  endMeeting: () => void
  submitRating: (rating: number) => void
}

const DemoWorkspaceContext = createContext<DemoWorkspaceContextValue | null>(
  null
)

const AGENDA: MeetingSection[] = ["scorecard", "ids", "conclude"]
const WORKSPACE_STORAGE_KEY = "altri.demo.workspace"

function nextTodoDueDate(): string {
  const date = new Date(`${DEMO_TODAY}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("team_member")
  const [selectedTeamId, setSelectedTeamIdState] = useState(DEMO_TEAMS[0].id)
  const [scores, setScores] = useState(() => DEMO_SCORES)
  const [issues, setIssues] = useState(DEMO_ISSUES)
  const [todos, setTodos] = useState(DEMO_TODOS)
  const [meeting, setMeeting] = useState<DemoMeeting | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          scores?: Record<string, Record<string, number | null>>
          issues?: DemoIssue[]
          todos?: DemoTodo[]
          meeting?: DemoMeeting | null
        }
        queueMicrotask(() => {
          if (parsed.scores) setScores(parsed.scores)
          if (parsed.issues) setIssues(parsed.issues)
          if (parsed.todos) setTodos(parsed.todos)
          if ("meeting" in parsed) setMeeting(parsed.meeting ?? null)
        })
      } catch {
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      }
    }

    function syncWorkspace(event: StorageEvent) {
      if (event.key !== WORKSPACE_STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as {
          scores?: Record<string, Record<string, number | null>>
          issues?: DemoIssue[]
          todos?: DemoTodo[]
          meeting?: DemoMeeting | null
        }
        if (parsed.scores) setScores(parsed.scores)
        if (parsed.issues) setIssues(parsed.issues)
        if (parsed.todos) setTodos(parsed.todos)
        if ("meeting" in parsed) setMeeting(parsed.meeting ?? null)
      } catch {
        // Ignore malformed cross-tab workspace snapshots.
      }
    }

    window.addEventListener("storage", syncWorkspace)
    return () => window.removeEventListener("storage", syncWorkspace)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ scores, issues, todos, meeting })
    )
  }, [scores, issues, todos, meeting])

  const currentUser = useMemo(
    () => ({ ...DEMO_USERS[0], role }),
    [role]
  )

  const teams = useMemo(
    () =>
      role === "admin"
        ? DEMO_TEAMS
        : DEMO_TEAMS.filter((team) =>
            team.memberIds.includes(currentUser.id)
          ),
    [currentUser.id, role]
  )

  const selectedTeam = useMemo(
    () =>
      teams.find((team) => team.id === selectedTeamId) ??
      teams[0] ??
      DEMO_TEAMS[0],
    [selectedTeamId, teams]
  )

  const setRole = useCallback(
    (nextRole: DemoRole) => {
      setRoleState(nextRole)
      if (nextRole !== "admin") {
        const accessibleTeams = DEMO_TEAMS.filter((team) =>
          team.memberIds.includes(currentUser.id)
        )
        if (!accessibleTeams.some((team) => team.id === selectedTeamId)) {
          setSelectedTeamIdState(accessibleTeams[0].id)
        }
      }
    },
    [currentUser.id, selectedTeamId]
  )

  const setSelectedTeamId = useCallback(
    (teamId: string) => {
      if (teams.some((team) => team.id === teamId)) {
        setSelectedTeamIdState(teamId)
      }
    },
    [teams]
  )

  const updateScore = useCallback(
    (measurableId: string, weekStart: string, score: number) => {
      setScores((previous) => ({
        ...previous,
        [measurableId]: {
          ...previous[measurableId],
          [weekStart]: score,
        },
      }))
    },
    []
  )

  const createIssue = useCallback(
    (
      title: string,
      priority: number | null = 3,
      source: DemoIssue["source"] = null
    ) => {
      if (source) {
        const existingIssue = issues.find(
          (issue) =>
            issue.source?.measurableId === source.measurableId &&
            issue.source.weekStart === source.weekStart &&
            !issue.solvedAt
        )
        if (existingIssue) {
          return existingIssue
        }
      }

      const issue: DemoIssue = {
        id: `demo-issue-${crypto.randomUUID()}`,
        title,
        ownerId: currentUser.id,
        priority,
        createdAt: "2026-11-24T15:00:00Z",
        source,
        solvedAt: null,
        resolutionNote: null,
      }
      setIssues((previous) => [issue, ...previous])
      return issue
    },
    [currentUser.id, issues]
  )

  const updateIssuePriority = useCallback(
    (issueId: string, priority: number | null) => {
      setIssues((previous) =>
        previous.map((issue) =>
          issue.id === issueId ? { ...issue, priority } : issue
        )
      )
    },
    []
  )

  const solveIssue = useCallback((issueId: string, note: string) => {
    setIssues((previous) =>
      previous.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              solvedAt: "2026-11-24T15:00:00Z",
              resolutionNote: note,
            }
          : issue
      )
    )
    setMeeting((previous) =>
      previous?.status === "active"
        ? {
            ...previous,
            solvedIssueIds: previous.solvedIssueIds.includes(issueId)
              ? previous.solvedIssueIds
              : [...previous.solvedIssueIds, issueId],
          }
        : previous
    )
  }, [])

  const addTodo = useCallback(
    (title: string, ownerId: string, issueId: string) => {
      const todo: DemoTodo = {
        id: `demo-todo-${crypto.randomUUID()}`,
        title,
        ownerId,
        dueDate: nextTodoDueDate(),
        doneAt: null,
        issueId,
        createdAt: "2026-11-24T15:00:00Z",
      }
      setTodos((previous) => [todo, ...previous])
      setMeeting((previous) =>
        previous?.status === "active"
          ? {
              ...previous,
              createdTodoIds: [...previous.createdTodoIds, todo.id],
            }
          : previous
      )
      return todo
    },
    []
  )

  const toggleTodo = useCallback((todoId: string) => {
    setTodos((previous) =>
      previous.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              doneAt: todo.doneAt ? null : "2026-11-24T15:00:00Z",
            }
          : todo
      )
    )
  }, [])

  const startMeeting = useCallback(() => {
    if (role === "observer") {
      return
    }
    setMeeting({
      status: "active",
      facilitatorId: currentUser.id,
      section: "scorecard",
      sectionStartedAt: Date.now(),
      attendees: [currentUser.id],
      ratings: {},
      createdTodoIds: [],
      solvedIssueIds: [],
      endedAt: null,
    })
  }, [currentUser.id, role])

  const joinMeeting = useCallback(() => {
    setMeeting((previous) => {
      if (!previous || previous.status !== "active") {
        return previous
      }
      return previous.attendees.includes(currentUser.id)
        ? previous
        : { ...previous, attendees: [...previous.attendees, currentUser.id] }
    })
  }, [currentUser.id])

  const advanceMeeting = useCallback(() => {
    setMeeting((previous) => {
      if (
        !previous ||
        previous.status !== "active" ||
        previous.facilitatorId !== currentUser.id
      ) {
        return previous
      }
      const currentIndex = AGENDA.indexOf(previous.section)
      if (currentIndex >= AGENDA.length - 1) {
        return previous
      }
      return {
        ...previous,
        section: AGENDA[currentIndex + 1],
        sectionStartedAt: Date.now(),
      }
    })
  }, [currentUser.id])

  const endMeeting = useCallback(() => {
    setMeeting((previous) => {
      if (
        !previous ||
        previous.status !== "active" ||
        previous.facilitatorId !== currentUser.id
      ) {
        return previous
      }
      return {
        ...previous,
        status: "ended",
        endedAt: "2026-11-24T15:00:00Z",
      }
    })
  }, [currentUser.id])

  const submitRating = useCallback(
    (rating: number) => {
      if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return
      }
      setMeeting((previous) => {
        if (
          !previous ||
          previous.status !== "active" ||
          previous.section !== "conclude" ||
          !previous.attendees.includes(currentUser.id) ||
          role === "observer"
        ) {
          return previous
        }
        return {
          ...previous,
          ratings: { ...previous.ratings, [currentUser.id]: rating },
        }
      })
    },
    [currentUser.id, role]
  )

  const contextValue = useMemo<DemoWorkspaceContextValue>(
    () => ({
      role,
      currentUser,
      teams,
      selectedTeamId,
      selectedTeam,
      setRole,
      setSelectedTeamId,
      measurables: DEMO_MEASURABLES,
      weeks: DEMO_WEEKS,
      scores,
      updateScore,
      issues,
      createIssue,
      updateIssuePriority,
      solveIssue,
      todos,
      addTodo,
      toggleTodo,
      rocks: DEMO_ROCKS,
      meeting,
      startMeeting,
      joinMeeting,
      advanceMeeting,
      endMeeting,
      submitRating,
    }),
    [
      addTodo,
      advanceMeeting,
      createIssue,
      currentUser,
      endMeeting,
      issues,
      joinMeeting,
      meeting,
      role,
      scores,
      selectedTeam,
      selectedTeamId,
      setRole,
      setSelectedTeamId,
      solveIssue,
      startMeeting,
      submitRating,
      teams,
      todos,
      toggleTodo,
      updateIssuePriority,
      updateScore,
    ]
  )

  return (
    <DemoWorkspaceContext.Provider value={contextValue}>
      {children}
    </DemoWorkspaceContext.Provider>
  )
}

export function useDemoWorkspace(): DemoWorkspaceContextValue {
  const context = useContext(DemoWorkspaceContext)
  if (!context) {
    throw new Error(
      "useDemoWorkspace must be used within DemoWorkspaceProvider."
    )
  }
  return context
}
