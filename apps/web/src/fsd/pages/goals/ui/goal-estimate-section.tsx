import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { GoalSnapshot } from "@/entities/goal"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { EstimateOutcome } from "../model/estimate/estimate.domain"

/**
 * "Original" (the goal's creation-time snapshot) vs. "Current" (freshly recalculated) estimate
 * comparison. Split out of goal-detail-sheet.tsx to keep that file under this repo's max-lines rule,
 * mirroring how goal-projects-field.tsx/goal-locations-field.tsx were split out for the same reason.
 */
export function GoalEstimateSection({
  snapshot,
  estimate,
  isolated,
}: {
  snapshot: GoalSnapshot | null
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
        {t("goals.detail.originalEstimate")}:{" "}
        {snapshot?.originalEstimateDays != null
          ? `${snapshot.originalEstimateDays}d · ${snapshot.originalEstimateDate}`
          : t("goals.detail.unavailable")}
      </p>
      <p>
        {t("goals.detail.currentEstimate")}:{" "}
        {estimate?.status === "Blocked"
          ? t(`goals.estimate.blocked.${estimate.reason}`)
          : estimate
            ? `${estimate.days}d · ${estimate.date}`
            : t("goals.detail.unavailable")}
      </p>
      {snapshot ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <EntityIcon alt="" className="size-5 shrink-0" src={energyIconUrl} />
          {t("goals.detail.originalResources", {
            count: snapshot.initialRequirement.reduce(
              (sum, item) => sum + item.count,
              0
            ),
            energy: snapshot.originalEnergyTotal ?? "—",
            raids: snapshot.originalRaidsTotal ?? "—",
          })}
        </p>
      ) : null}
    </section>
  )
}
