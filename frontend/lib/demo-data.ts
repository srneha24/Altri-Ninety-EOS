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
  source: { measurableId: string; weekStart: string } | null
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

export type MeetingSection = "scorecard" | "ids" | "conclude"

export type DemoMeeting = {
  status: "active" | "ended"
  teamId: string
  facilitatorId: string
  section: MeetingSection
  sectionStartedAt: number
  attendees: string[]
  ratings: Record<string, number>
  createdTodoIds: string[]
  solvedIssueIds: string[]
  endedAt: string | null
  snapshot?: MeetingSummarySnapshot
}

export type DemoEndedMeeting = {
  id: string
  teamId: string
  endedAt: string
  attendees: string[]
  ratings: Record<string, number>
  solvedIssueIds: string[]
  createdTodoIds: string[]
  snapshot?: MeetingSummarySnapshot
}

export type MeetingSummarySnapshot = {
  endedAt: string
  weekStart: string
  measurables: {
    id: string
    name: string
    ownerId: string
    unit: string
    goal: Goal
    score: number | null
  }[]
  solvedIssues: { id: string; title: string; resolutionNote: string }[]
  createdTodos: {
    id: string
    title: string
    ownerId: string
    dueDate: string
    issueId: string | null
  }[]
  attendees: string[]
  ratings: Record<string, number>
}

export const DEMO_USERS: DemoUser[] = [
  { id: "demo-alex", name: "Alex Morgan", role: "team_member", initials: "AM" },
  { id: "demo-jordan", name: "Jordan Lee", role: "admin", initials: "JL" },
  { id: "demo-sam", name: "Sam Rivera", role: "team_member", initials: "SR" },
  { id: "demo-taylor", name: "Taylor Quinn", role: "observer", initials: "TQ" },
]

export const DEMO_TEAMS: DemoTeam[] = [
  {
    id: "demo-team-studio",
    name: "Northstar Studio",
    memberIds: ["demo-alex", "demo-jordan", "demo-sam", "demo-taylor"],
  },
  {
    id: "demo-team-operations",
    name: "Field Operations",
    memberIds: ["demo-alex", "demo-jordan", "demo-taylor"],
  },
  {
    id: "demo-team-growth",
    name: "Customer Growth",
    memberIds: ["demo-jordan", "demo-sam"],
  },
]

export const DEMO_MEASURABLES: DemoMeasurable[] = [
  {
    id: "qualified-demos",
    name: "Qualified demos",
    ownerId: "demo-alex",
    unit: "demos",
    goal: { type: "at_least", value: 8 },
    teamId: "demo-team-studio",
  },
  {
    id: "first-response",
    name: "First response time",
    ownerId: "demo-sam",
    unit: "hours",
    goal: { type: "at_most", value: 2.5 },
    teamId: "demo-team-operations",
  },
  {
    id: "customer-sentiment",
    name: "Customer sentiment",
    ownerId: "demo-jordan",
    unit: "out of 5",
    goal: { type: "between", min: 4.2, max: 5 },
    teamId: "demo-team-growth",
  },
  {
    id: "release-blockers",
    name: "Release blockers",
    ownerId: "demo-alex",
    unit: "blockers",
    goal: { type: "exactly", value: 0 },
    teamId: "demo-team-operations",
  },
]

export const DEMO_WEEKS = [
  "2026-08-31",
  "2026-09-07",
  "2026-09-14",
  "2026-09-21",
  "2026-09-28",
  "2026-10-05",
  "2026-10-12",
  "2026-10-19",
  "2026-10-26",
  "2026-11-02",
  "2026-11-09",
  "2026-11-16",
  "2026-11-23",
]

export const DEMO_SCORES: Record<string, Record<string, number | null>> = {
  "qualified-demos": {
    "2026-08-31": 7,
    "2026-09-07": 9,
    "2026-09-14": 8,
    "2026-09-21": 10,
    "2026-09-28": 8,
    "2026-10-05": 6,
    "2026-10-12": 8,
    "2026-10-19": 9,
    "2026-10-26": 7,
    "2026-11-02": 10,
    "2026-11-09": 8,
    "2026-11-16": 7,
    "2026-11-23": 5,
  },
  "first-response": {
    "2026-08-31": 2.2,
    "2026-09-07": 2.4,
    "2026-09-14": 2.1,
    "2026-09-21": 2.7,
    "2026-09-28": 2.3,
    "2026-10-05": 2.8,
    "2026-10-12": 2.4,
    "2026-10-19": 2.2,
    "2026-10-26": 2.6,
    "2026-11-02": 2.3,
    "2026-11-09": 2.1,
    "2026-11-16": 2.4,
    "2026-11-23": 2.2,
  },
  "customer-sentiment": {
    "2026-08-31": 4.4,
    "2026-09-07": 4.5,
    "2026-09-14": 4.1,
    "2026-09-21": 4.3,
    "2026-09-28": 4.4,
    "2026-10-05": 4.6,
    "2026-10-12": 4.2,
    "2026-10-19": 4.3,
    "2026-10-26": 4.4,
    "2026-11-02": 4.2,
    "2026-11-09": 4.5,
    "2026-11-16": 4.4,
    "2026-11-23": null,
  },
  "release-blockers": {
    "2026-08-31": 0,
    "2026-09-07": 0,
    "2026-09-14": 1,
    "2026-09-21": 0,
    "2026-09-28": 0,
    "2026-10-05": 0,
    "2026-10-12": 2,
    "2026-10-19": 0,
    "2026-10-26": 0,
    "2026-11-02": 0,
    "2026-11-09": 0,
    "2026-11-16": 0,
    "2026-11-23": 0,
  },
}

export const DEMO_ISSUES: DemoIssue[] = [
  {
    id: "demo-issue-briefing",
    title: "Demo follow-up cadence is inconsistent",
    ownerId: "demo-alex",
    teamId: "demo-team-studio",
    priority: 5,
    createdAt: "2026-11-16T15:40:00Z",
    source: { measurableId: "qualified-demos", weekStart: "2026-11-16" },
    solvedAt: null,
    resolutionNote: null,
  },
  {
    id: "demo-issue-onboarding",
    title: "New customer handoff needs a clear owner",
    ownerId: "demo-sam",
    teamId: "demo-team-studio",
    priority: 3,
    createdAt: "2026-11-18T17:10:00Z",
    source: null,
    solvedAt: null,
    resolutionNote: null,
  },
  {
    id: "demo-issue-template",
    title: "Refresh the product walkthrough template",
    ownerId: "demo-jordan",
    teamId: "demo-team-studio",
    priority: 2,
    createdAt: "2026-11-10T16:20:00Z",
    source: null,
    solvedAt: "2026-11-17T18:00:00Z",
    resolutionNote: "The team published a new shared walkthrough outline.",
  },
]

export const DEMO_TODOS: DemoTodo[] = [
  {
    id: "demo-todo-checklist",
    title: "Draft the demo follow-up checklist",
    ownerId: "demo-alex",
    teamId: "demo-team-studio",
    dueDate: "2026-11-27",
    doneAt: null,
    issueId: "demo-issue-briefing",
    createdAt: "2026-11-20T15:00:00Z",
  },
  {
    id: "demo-todo-handoff",
    title: "Map the customer handoff steps",
    ownerId: "demo-sam",
    teamId: "demo-team-studio",
    dueDate: "2026-11-20",
    doneAt: null,
    issueId: "demo-issue-onboarding",
    createdAt: "2026-11-13T16:00:00Z",
  },
  {
    id: "demo-todo-notes",
    title: "Share notes from the user interviews",
    ownerId: "demo-jordan",
    teamId: "demo-team-studio",
    dueDate: "2026-11-19",
    doneAt: "2026-11-18T14:30:00Z",
    issueId: null,
    createdAt: "2026-11-12T14:00:00Z",
  },
]

export const DEMO_ROCKS: DemoRock[] = [
  {
    id: "demo-rock-onboarding",
    title: "Make customer onboarding feel effortless",
    ownerId: "demo-jordan",
    teamId: "demo-team-studio",
    seededStatus: "on_track",
    milestones: [
      { id: "demo-milestone-map", title: "Map the first-week journey", dueDate: "2026-10-30", done: true },
      { id: "demo-milestone-guide", title: "Publish the welcome guide", dueDate: "2026-11-20", done: true },
      { id: "demo-milestone-feedback", title: "Review early customer feedback", dueDate: "2026-12-11", done: false },
    ],
  },
  {
    id: "demo-rock-launch",
    title: "Ship the next release with confidence",
    ownerId: "demo-alex",
    teamId: "demo-team-studio",
    seededStatus: "off_track",
    milestones: [
      { id: "demo-milestone-qa", title: "Complete the quality checklist", dueDate: "2026-11-06", done: true },
      { id: "demo-milestone-docs", title: "Finish release notes", dueDate: "2026-11-20", done: false },
    ],
  },
  {
    id: "demo-rock-reporting",
    title: "Give every team a useful weekly view",
    ownerId: "demo-sam",
    teamId: "demo-team-studio",
    seededStatus: "complete",
    milestones: [],
  },
]

export const MEETING_AGENDA: {
  id: MeetingSection
  label: string
  durationMinutes: number
}[] = [
  { id: "scorecard", label: "Scorecard", durationMinutes: 5 },
  { id: "ids", label: "IDS · Identify, Discuss, Solve", durationMinutes: 60 },
  { id: "conclude", label: "Conclude", durationMinutes: 10 },
]

export const DEMO_TODAY = "2026-11-24"

export const DEMO_ENDED_MEETINGS: DemoEndedMeeting[] = [
  {
    id: "demo-ended-week-1",
    teamId: "demo-team-studio",
    endedAt: "2026-11-17T16:10:00Z",
    attendees: ["demo-alex", "demo-jordan", "demo-sam"],
    ratings: { "demo-alex": 8, "demo-jordan": 9, "demo-sam": 8 },
    solvedIssueIds: ["demo-issue-template"],
    createdTodoIds: [],
    snapshot: {
      endedAt: "2026-11-17T16:10:00Z",
      weekStart: "2026-11-16",
      measurables: [
        { id: "qualified-demos", name: "Qualified demos", ownerId: "demo-alex", unit: "demos", goal: { type: "at_least", value: 8 }, score: 7 },
        { id: "first-response", name: "First response time", ownerId: "demo-sam", unit: "hours", goal: { type: "at_most", value: 2.5 }, score: 2.4 },
        { id: "customer-sentiment", name: "Customer sentiment", ownerId: "demo-jordan", unit: "out of 5", goal: { type: "between", min: 4.2, max: 5 }, score: 4.4 },
        { id: "release-blockers", name: "Release blockers", ownerId: "demo-alex", unit: "blockers", goal: { type: "exactly", value: 0 }, score: 0 },
      ],
      solvedIssues: [{ id: "demo-issue-template", title: "Refresh the product walkthrough template", resolutionNote: "The team published a new shared walkthrough outline." }],
      createdTodos: [],
      attendees: ["demo-alex", "demo-jordan", "demo-sam"],
      ratings: { "demo-alex": 8, "demo-jordan": 9, "demo-sam": 8 },
    },
  },
  {
    id: "demo-ended-week-2",
    teamId: "demo-team-studio",
    endedAt: "2026-11-10T16:05:00Z",
    attendees: ["demo-alex", "demo-jordan", "demo-taylor"],
    ratings: { "demo-alex": 7, "demo-jordan": 8 },
    solvedIssueIds: [],
    createdTodoIds: ["demo-todo-notes"],
    snapshot: {
      endedAt: "2026-11-10T16:05:00Z",
      weekStart: "2026-11-09",
      measurables: [
        { id: "qualified-demos", name: "Qualified demos", ownerId: "demo-alex", unit: "demos", goal: { type: "at_least", value: 8 }, score: 8 },
        { id: "first-response", name: "First response time", ownerId: "demo-sam", unit: "hours", goal: { type: "at_most", value: 2.5 }, score: 2.1 },
        { id: "customer-sentiment", name: "Customer sentiment", ownerId: "demo-jordan", unit: "out of 5", goal: { type: "between", min: 4.2, max: 5 }, score: 4.5 },
        { id: "release-blockers", name: "Release blockers", ownerId: "demo-alex", unit: "blockers", goal: { type: "exactly", value: 0 }, score: 0 },
      ],
      solvedIssues: [],
      createdTodos: [{ id: "demo-todo-notes", title: "Share notes from the user interviews", ownerId: "demo-jordan", dueDate: "2026-11-19", issueId: null }],
      attendees: ["demo-alex", "demo-jordan", "demo-taylor"],
      ratings: { "demo-alex": 7, "demo-jordan": 8 },
    },
  },
]
