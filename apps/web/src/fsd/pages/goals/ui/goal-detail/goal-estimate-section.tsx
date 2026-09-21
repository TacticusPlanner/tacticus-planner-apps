import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { EstimateOutcome } from "@/features/goal-farming"
import { EstimateCell } from "../goals-board/goal-row-shared"

/**
 * Freshly recalculated estimate for the goal. Split out of goal-detail-sheet.tsx to keep that file
 * under this repo's max-lines rule, mirroring how goal-projects-field.tsx/goal-locations-field.tsx
 * were split out for the same reason.
 *
 * The date and day count come from `EstimateCell` — the same renderer the Goals list rows use — so
 * one goal reads identically in both places (goal-detail-estimate-display). `EstimateCell` renders
 * nothing for a blocked or absent estimate, which is why the framing label shares its condition:
 * a label that says how a figure was computed must not outlive the figure.
 */
export function GoalEstimateSection({
  estimate,
  isolated,
}: {
  estimate: EstimateOutcome | undefined
  isolated: boolean
}) {
  const { t } = useTranslation()
  const hasEstimate = !!estimate && estimate.status !== "Blocked"

  return (
    <section className="grid gap-2">
      <h3 className="font-semibold">{t("goals.detail.estimateTitle")}</h3>
      {hasEstimate ? (
        <>
          <EstimateCell estimate={estimate} />
          {isolated ? (
            <Badge variant="outline">
              {t("goals.detail.isolatedEstimate")}
            </Badge>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("goals.detail.planAwareEstimate")}
            </p>
          )}
        </>
      ) : (
        <p>
          {estimate?.status === "Blocked"
            ? t(`goals.estimate.blocked.${estimate.reason}`)
            : t("goals.detail.unavailable")}
        </p>
      )}
    </section>
  )
}
