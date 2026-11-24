import { useTranslation } from "react-i18next"
import { CornerLeftUp } from "lucide-react"

import { goalTargetLabel } from "@/entities/goal"
import type { GoalDetail } from "@/entities/goal"

/** "Covered by #3 · Rank → Adamantine I": a higher-priority goal of the same unit and type already
 *  reaches this milestone's target, so it adds no work of its own (goal-milestone-planning). With
 *  `onJump`, the note is a link to that goal. */
export function CoveredByNote({
  coveredBy,
  onJump,
}: {
  coveredBy: GoalDetail | null | undefined
  onJump?: (goalId: string) => void
}) {
  const { t } = useTranslation()
  if (!coveredBy) return null
  const goal = `${t(`goals.create.goalTypes.${coveredBy.goalType}`)} → ${goalTargetLabel(t, coveredBy) ?? ""}`
  const text =
    coveredBy.globalPriority === null
      ? t("goals.overview.coveredBy", {
          type: t(`goals.create.goalTypes.${coveredBy.goalType}`),
          target: goalTargetLabel(t, coveredBy) ?? "",
        })
      : t("goals.overview.coveredByPriority", {
          priority: coveredBy.globalPriority,
          goal,
        })
  if (!onJump) {
    return (
      <p
        className="text-xs text-muted-foreground"
        data-testid="goal-covered-by"
      >
        {text}
      </p>
    )
  }
  return (
    <button
      className="flex items-center gap-1 rounded-sm text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      data-testid="goal-covered-by"
      onClick={(event) => {
        // The row itself navigates on click; this link goes to the other goal instead.
        event.stopPropagation()
        onJump(coveredBy.goalId)
      }}
      type="button"
    >
      <CornerLeftUp aria-hidden="true" className="size-3 shrink-0" />
      {text}
    </button>
  )
}
