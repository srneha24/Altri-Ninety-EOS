import { getAccessToken } from "@/lib/auth"
import { apiRequest } from "@/lib/api-client"
import type { DemoRole, Goal } from "@/lib/types"

export type ApiUser = {
  id: string
  name: string
  role: DemoRole
}

export type ApiTeam = {
  id: string
  name: string
}

export type ApiMember = Pick<ApiUser, "id" | "name" | "role">

export type ApiScore = {
  id: string
  week_start: string
  value: number
}

export type ApiMeasurable = {
  id: string
  name: string
  unit: string
  goal: Goal
  owner: Pick<ApiUser, "id" | "name">
  scores: ApiScore[]
}

export type ApiIssueSource = {
  measurable_id?: string
  rock_id?: string
  todo_id?: string
  week_start?: string
  title?: string | null
}

export type ApiIssue = {
  id: string
  title: string
  priority: number | null
  created_at: string
  solved_at: string | null
  resolution_note: string | null
  source: ApiIssueSource | null
  owner: Pick<ApiUser, "id" | "name">
}

export type ApiTodo = {
  id: string
  title: string
  due_date: string
  done_at: string | null
  created_at: string
  issue: { id: string; title: string } | null
  owner: Pick<ApiUser, "id" | "name">
}

export type ApiMilestone = {
  id: string
  title: string
  due_date: string
  done: boolean
}

export type ApiRock = {
  id: string
  title: string
  quarter: string
  status: "on_track" | "off_track" | "complete"
  owner: Pick<ApiUser, "id" | "name">
  milestones: ApiMilestone[]
}

export type MeetingState = "start" | "ids" | "conclude" | "end"

export type ApiMeetingAttendee = {
  id: string
  joined_at: string | null
  rating: number | null
  user: Pick<ApiUser, "id" | "name">
}

export type ApiMeeting = {
  id: string
  started_at: string
  ids_started_at: string | null
  conclude_started_at: string | null
  ended_at: string | null
  state: MeetingState
  facilitator: Pick<ApiUser, "id" | "name">
  attendees: ApiMeetingAttendee[]
}

export type ApiMeetingSummary = {
  id: string
  reviewed_week: string
  started_at: string
  ids_started_at: string | null
  conclude_started_at: string | null
  ended_at: string
  duration_seconds: number
  average_rating: number | null
  facilitator: Pick<ApiUser, "id" | "name">
  measurables: Array<{
    id: string
    name: string
    unit: string
    goal: Goal
    score: number | null
    status: "on_track" | "off_track"
  }>
  issues: { created: ApiIssue[]; solved: ApiIssue[] }
  todos: { created: ApiTodo[]; done: ApiTodo[] }
  attendees: ApiMeetingAttendee[]
}

async function authenticatedRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error("Your session has expired. Please sign in.")
  }
  return apiRequest<T>(path, init, accessToken)
}

export function getCurrentUser(): Promise<ApiUser> {
  return authenticatedRequest("/auth/me")
}

export async function getUserTeams(): Promise<ApiTeam[]> {
  const result = await authenticatedRequest<{ teams: ApiTeam[] }>("/auth/teams")
  return result.teams
}

export function getTeamMembers(teamId: string): Promise<ApiMember[]> {
  return authenticatedRequest(`/company/teams/${encodeURIComponent(teamId)}/members`)
}

export function getScorecard(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<ApiMeasurable[]> {
  const query = new URLSearchParams({ start_date: startDate, end_date: endDate })
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/scorecard?${query}`
  )
}

export function updateScore(
  teamId: string,
  scoreId: string,
  value: number
): Promise<ApiScore> {
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/scores/${encodeURIComponent(scoreId)}`,
    { method: "PATCH", body: JSON.stringify({ value }) }
  )
}

export function getIssues(teamId: string): Promise<ApiIssue[]> {
  const query = new URLSearchParams({
    status: "all",
    order_by: "-priority",
  })
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/issues?${query}`
  )
}

export function createIssue(
  teamId: string,
  payload: {
    title?: string
    priority?: number | null
    source?: { measurable_id: string; week_start: string }
  }
): Promise<ApiIssue> {
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/issues`,
    { method: "POST", body: JSON.stringify(payload) }
  )
}

export function updateIssue(
  teamId: string,
  issueId: string,
  payload: { priority?: number | null; resolution_note?: string }
): Promise<ApiIssue> {
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/issues/${encodeURIComponent(issueId)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  )
}

export function getTodos(teamId: string): Promise<ApiTodo[]> {
  const query = new URLSearchParams({ order_by: "due_date" })
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/todos?${query}`
  )
}

export function createTodo(
  teamId: string,
  payload: { title: string; owner_id: string; source_issue_id?: string }
): Promise<ApiTodo> {
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/todos`,
    { method: "POST", body: JSON.stringify(payload) }
  )
}

export function updateTodo(
  teamId: string,
  todoId: string,
  done: boolean
): Promise<ApiTodo> {
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/todos/${encodeURIComponent(todoId)}`,
    { method: "PATCH", body: JSON.stringify({ done }) }
  )
}

export function getQuarterlyRocks(
  teamId: string,
  quarter: string
): Promise<ApiRock[]> {
  const query = new URLSearchParams({ quarter })
  return authenticatedRequest(
    `/traction/teams/${encodeURIComponent(teamId)}/quarterly-rocks?${query}`
  )
}

function meetingPath(teamId: string): string {
  return `/traction/teams/${encodeURIComponent(teamId)}/meetings`
}

export function getActiveMeeting(teamId: string): Promise<ApiMeeting> {
  return authenticatedRequest(`${meetingPath(teamId)}/active`)
}

export function updateMeetingState(
  teamId: string,
  state: MeetingState,
  meetingId?: string
): Promise<ApiMeeting> {
  return authenticatedRequest(`${meetingPath(teamId)}/state`, {
    method: "POST",
    body: JSON.stringify({ state, meeting_id: meetingId }),
  })
}

export function joinMeeting(teamId: string, meetingId: string): Promise<void> {
  return authenticatedRequest(
    `${meetingPath(teamId)}/${encodeURIComponent(meetingId)}/attendees`,
    { method: "POST" }
  )
}

export function rateMeeting(
  teamId: string,
  meetingId: string,
  rating: number
): Promise<void> {
  return authenticatedRequest(
    `${meetingPath(teamId)}/${encodeURIComponent(meetingId)}/ratings`,
    { method: "POST", body: JSON.stringify({ rating }) }
  )
}

export function getMeetingSummaries(teamId: string): Promise<ApiMeetingSummary[]> {
  return authenticatedRequest(`${meetingPath(teamId)}/summaries`)
}

export function getMeetingSummary(
  teamId: string,
  meetingId: string
): Promise<ApiMeetingSummary> {
  return authenticatedRequest(
    `${meetingPath(teamId)}/${encodeURIComponent(meetingId)}/summary`
  )
}
