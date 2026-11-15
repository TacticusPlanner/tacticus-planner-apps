import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { ProjectSummary } from "@/entities/project"
import {
  MoveProjectGoalsDialog,
  moveGoalsChoices,
} from "@/features/goal-planning"

/**
 * The scoped Goals header's Move goals… (project-goal-moves): opens the dialog (a bottom sheet on
 * mobile) that places the scoped project's in-flight goals at the top, or before or after another
 * project. Icon-only with an accessible name on mobile. Renders nothing when the project has no
 * in-flight goals, and is disabled when no placement would change the order.
 */
export function GoalsMoveProjectGoalsButton({
  project,
  projects,
  goals,
}: {
  project: ProjectSummary
  projects: readonly ProjectSummary[]
  /** The non-archived goals list. */
  goals: readonly {
    goalId: string
    status: string
    globalPriority: number | null
    projectIds: readonly string[]
  }[]
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const choices = moveGoalsChoices(project.projectId, projects, goals)
  if (choices.movedIds.length === 0) return null
  const stuck = !choices.topChanges && choices.references.length === 0
  const label = t("goals.order.projectMove.menuItem")

  return (
    <>
      <Button
        aria-label={isMobile ? label : undefined}
        data-testid="project-move-goals"
        disabled={stuck}
        onClick={() => setOpen(true)}
        size={isMobile ? "icon" : "sm"}
        title={stuck ? t("goals.order.projectMove.alreadyFirst") : undefined}
        variant="outline"
      >
        <ArrowUpDown />
        {isMobile ? null : label}
      </Button>
      {open ? (
        <MoveProjectGoalsDialog
          goals={goals}
          onOpenChange={setOpen}
          project={project}
          projects={projects}
        />
      ) : null}
    </>
  )
}
