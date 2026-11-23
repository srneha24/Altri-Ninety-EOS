import { IssuesSection } from "@/components/issues-section"
import { RocksSection } from "@/components/rocks-section"
import { ScorecardSection } from "@/components/scorecard-section"
import { TodosSection } from "@/components/todos-section"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function TeamPage() {
  return (
    <WorkspaceShell activePage="team">
      <div className="space-y-6">
        <ScorecardSection />
        <IssuesSection />
        <TodosSection />
        <RocksSection />
      </div>
    </WorkspaceShell>
  )
}
