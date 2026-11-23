import { MeetingPage } from "@/components/meeting-page"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function MeetingRoute() {
  return (
    <WorkspaceShell activePage="meeting">
      <MeetingPage />
    </WorkspaceShell>
  )
}
