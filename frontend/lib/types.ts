export type DemoRole = "admin" | "team_member" | "observer"

export type DemoUser = {
  id: string
  name: string
  role: DemoRole
  initials: string
}

export type DemoTeam = {
  id: string
  name: string
  memberIds: string[]
}

export type Goal =
  | { type: "at_least"; value: number }
  | { type: "at_most"; value: number }
  | { type: "between"; min: number; max: number }
  | { type: "exactly"; value: number }

export type DemoMeasurable = {
  id: string
  name: string
  ownerId: string
  unit: string
  goal: Goal
  teamId?: string
}

export type DemoIssue = {
  id: string
  title: string
  ownerId: string
  teamId?: string
  priority: number | null
  createdAt: string
  source:
    | { measurableId: string; weekStart: string }
    | { rockId: string }
    | { todoId: string }
    | null
  solvedAt: string | null
  resolutionNote: string | null
}

export type DemoTodo = {
  id: string
  title: string
  ownerId: string
  teamId?: string
  dueDate: string
  doneAt: string | null
  issueId: string | null
  createdAt: string
}

export type DemoMilestone = {
  id: string
  title: string
  dueDate: string
  done: boolean
}

export type DemoRock = {
  id: string
  title: string
  ownerId: string
  teamId?: string
  seededStatus: "on_track" | "off_track" | "complete"
  milestones: DemoMilestone[]
}

export const APP_NOW = "2026-11-11T15:00:00Z"
