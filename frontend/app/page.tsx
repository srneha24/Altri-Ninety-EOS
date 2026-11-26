import { TeamPageContent } from "@/components/team-page-content"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function TeamPage() {
  return (
    <WorkspaceShell activePage="team">
      <TeamPageContent />
    </WorkspaceShell>
  )
}
