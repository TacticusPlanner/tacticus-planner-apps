import { useTranslation } from "react-i18next"
import { incursionTokenIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { RARITY_FILL, RARITY_FILL_FAINT } from "@/entities/incursion"

import type { Incursion } from "../../model/incursions.model"
import {
  tierClearance,
  type TierStars,
} from "../../model/incursion-progress.model"
import { useTierName } from "./use-tier-name"

/**
 * A MoW's tiers as the game's progress strip: one segment per tier in its rarity colour, solid once
 * cleared and faint until then, with the cleared count beside it.
 */
export function IncursionTierStrip({
  incursion,
  stars,
  "data-testid": testId,
}: {
  incursion: Incursion
  stars: TierStars
  "data-testid"?: string
}) {
  const { t } = useTranslation("incursions")
  const tierName = useTierName(incursion)
  const tiers = tierClearance(incursion, stars)
  const cleared = tiers.filter((tier) => tier.cleared).length
  const label = t("progress.badge", { cleared, total: tiers.length })
  return (
    <div
      className="flex min-w-0 items-center gap-1.5"
      role="img"
      aria-label={label}
      title={label}
      data-testid={testId}
      data-cleared-count={cleared}
    >
      <EntityIcon
        src={incursionTokenIcon()}
        alt=""
        className="size-4 shrink-0"
      />
      <div className="flex h-3 min-w-0 flex-1 gap-0.5" aria-hidden="true">
        {tiers.map((tier) => (
          <span
            key={tier.index}
            className={cn(
              "flex-1 rounded-[3px] first:rounded-l-full last:rounded-r-full",
              tier.cleared
                ? RARITY_FILL[tier.rarity]
                : cn(
                    RARITY_FILL_FAINT[tier.rarity],
                    "ring-1 ring-(--border) ring-inset"
                  )
            )}
            title={tierName(tier.index)}
            data-cleared={tier.cleared || undefined}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
        {cleared}/{tiers.length}
      </span>
    </div>
  )
}
