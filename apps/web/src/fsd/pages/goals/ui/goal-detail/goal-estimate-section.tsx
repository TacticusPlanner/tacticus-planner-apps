import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { EstimateOutcome } from "@/features/goal-farming"

/**
 * Freshly recalculated estimate for the goal. Split out of goal-detail-sheet.tsx to keep that file
 * under this repo's max-lines rule, mirroring how goal-projects-field.tsx/goal-locations-field.tsx
 * were split out for the same reason.
 */
export function GoalEstimateSection({
  estimate,
  isolated,
}: {
  estimate: EstimateOutcome | undefined
  isolated: boolean
}) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-2">
      <h3 className="font-semibold">{t("goals.detail.estimateTitle")}</h3>
      {isolated ? (
        <Badge variant="outline">{t("goals.detail.isolatedEstimate")}</Badge>
      ) : null}
      <p>
        {estimate?.status === "Blocked"
          ? t(`goals.estimate.blocked.${estimate.reason}`)
          : estimate
            ? t("goals.create.previewEstimate", { days: estimate.days })
            : t("goals.detail.unavailable")}
      </p>
    </section>
  )
}
