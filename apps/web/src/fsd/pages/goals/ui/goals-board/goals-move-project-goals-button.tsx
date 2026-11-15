import { useTranslation } from "react-i18next"
import { ArrowUpToLine } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  projectGoalsAlreadyFirst,
  projectInFlightGoalIds,
  useMoveProjectGoals,
} from "@/features/goal-planning"

/**
 * The scoped Goals header's Move goals to top (project-goal-moves): moves the scoped project's
 * in-flight goals to the top of the account-wide order, with an Undo toast. Icon-only with an
 * accessible name on mobile. Renders nothing when the project has no in-flight goals, and is
 * disabled when they are already first.
 */
export function GoalsMoveProjectGoalsButton({
  goals,
}: {
  /** The scoped project's goals (any status). */
  goals: readonly {
    goalId: string
    status: string
    globalPriority: number | null
  }[]
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { moveToTop, pending } = useMoveProjectGoals()
  const ids = projectInFlightGoalIds(goals)
  if (ids.length === 0) return null
  const alreadyFirst = projectGoalsAlreadyFirst(goals)
  const label = t("goals.order.projectMove.menuItem")

  return (
    <Button
      aria-label={isMobile ? label : undefined}
      data-testid="project-move-goals"
      disabled={pending || alreadyFirst}
      onClick={() => void moveToTop(ids)}
      size={isMobile ? "icon" : "sm"}
      title={
        alreadyFirst ? t("goals.order.projectMove.alreadyFirst") : undefined
      }
      variant="outline"
    >
      <ArrowUpToLine />
      {isMobile ? null : label}
    </Button>
  )
}
