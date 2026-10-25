import { useTranslation } from "react-i18next"

import { goalTargetLabel, type GoalDetail } from "@/entities/goal"

/** "Covered by the Rank → Adamantine I goal": a higher-priority goal of the same unit and type already
 *  reaches this milestone's target, so it adds no work of its own (goal-milestone-planning). */
export function CoveredByNote({
  coveredBy,
}: {
  coveredBy: GoalDetail | null | undefined
}) {
  const { t } = useTranslation()
  if (!coveredBy) return null
  return (
    <p className="text-xs text-muted-foreground" data-testid="goal-covered-by">
      {t("goals.overview.coveredBy", {
        type: t(`goals.create.goalTypes.${coveredBy.goalType}`),
        target: goalTargetLabel(t, coveredBy) ?? "",
      })}
    </p>
  )
}
