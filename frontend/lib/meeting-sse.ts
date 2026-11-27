import type { ApiMeeting } from "@/lib/api"
import { ApiError } from "@/lib/api-client"

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  return baseUrl.replace(/\/+$/, "")
}

type MeetingEventHandlers = {
  onMeetingState: (meeting: ApiMeeting) => void
  onWorkspaceUpdated?: () => void
  onUnavailable: (message: string) => void
}

export async function readMeetingEventStream(
  teamId: string,
  meetingId: string,
  accessToken: string,
  signal: AbortSignal,
  handlers: MeetingEventHandlers
): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/traction/teams/${encodeURIComponent(teamId)}/meetings/${encodeURIComponent(meetingId)}/sse`,
    {
      headers: { Accept: "text/event-stream", Authorization: `Bearer ${accessToken}` },
      signal,
    }
  )
  if (!response.ok || !response.body) {
    throw new ApiError(`Meeting stream failed with status ${response.status}.`, response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (!signal.aborted) {
    const chunk = await reader.read()
    if (chunk.done) return
    buffer += decoder.decode(chunk.value, { stream: true })
    let boundary = buffer.indexOf("\n\n")
    while (boundary >= 0) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf("\n\n")
      const event = frame.match(/^event: (.+)$/m)?.[1]
      const data = frame.match(/^data: (.+)$/m)?.[1]
      if (!event || !data) continue
      if (event === "meeting_state") handlers.onMeetingState(JSON.parse(data) as ApiMeeting)
      if (event === "workspace_updated") handlers.onWorkspaceUpdated?.()
      if (event === "meeting_unavailable") handlers.onUnavailable("This meeting is no longer available.")
    }
  }
}
