import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { HrePace } from "../model/hre-pace"

/**
 * Mobile only (design D4): the pace in one line under the current mission (points now → projected
 * points · the step reached), or a request for points, with a button to the full pace card.
 */
export function PaceSummary({
  points,
  pace,
  onDetails,
}: {
  points: number | null
  pace: HrePace | null
  onDetails: () => void
}) {
  const { t, i18n } = useTranslation("hre")
  const n = (value: number) => value.toLocaleString(i18n.language)
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground"
      data-testid="hre-pace-summary"
    >
      <p className="tabular-nums">
        {pace && points !== null
          ? t("pace.summary", {
              points: n(points),
              projected: n(pace.projectedPoints),
              step: pace.reached
                ? t(`pace.steps.${pace.reached.id}`)
                : t("pace.notUnlocked"),
            })
          : t("pace.summaryEmpty")}
      </p>
      <Button
        className="shrink-0"
        data-testid="hre-pace-summary-details"
        onClick={onDetails}
        size="sm"
        variant="outline"
      >
        {t("pace.details")}
      </Button>
    </div>
  )
}
