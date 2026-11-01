import { useTranslation } from "react-i18next"

import {
  clearedTierCount,
  remainingShards,
  type TierStars,
} from "../../model/incursion-progress.model"
import type { Incursion } from "../../model/incursions.model"

/**
 * One MoW's progress at a glance: tiers cleared and the one-time star-reward shards still on offer.
 * Stars are set on each battle in the run map below.
 */
export function IncursionProgressControl({
  incursion,
  stars,
}: {
  incursion: Incursion
  stars: TierStars
}) {
  const { t } = useTranslation("incursions")
  const left = remainingShards(incursion, stars)
  const cleared = clearedTierCount(incursion, stars)
  const nothingLeft = left.shards === 0 && left.mythicShards === 0

  return (
    <div
      className="space-y-1 rounded-lg border bg-muted/30 p-3"
      data-testid="incursion-progress"
    >
      <p className="text-sm font-medium" data-testid="incursion-progress-tiers">
        {t("progress.tiersCleared", {
          cleared,
          total: incursion.tiers.length,
        })}
      </p>
      <p
        className="text-sm text-muted-foreground"
        data-testid="incursion-progress-remaining"
      >
        {nothingLeft
          ? t("progress.allClaimed")
          : left.mythicShards > 0
            ? t("progress.remainingMythic", left)
            : t("progress.remaining", { shards: left.shards })}
      </p>
      <p className="text-xs text-muted-foreground">{t("progress.howTo")}</p>
    </div>
  )
}
