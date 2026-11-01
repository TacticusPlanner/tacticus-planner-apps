import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { shopRewardDisplay } from "@/features/shop-rewards"
import { toById, useCatalogDataset } from "@/shared/local-data"
import { EntityIcon } from "@/shared/ui"

import { sumRewards } from "../../model/incursions.model"

const NO_UNITS = new Map<string, { name: string }>()

/** Game reward strings as compact icon + amount chips, summed by id, each named by its tooltip. */
export function IncursionRewards({
  rewards,
  className,
  "data-testid": testId,
}: {
  rewards: readonly string[]
  className?: string
  "data-testid"?: string
}) {
  const { t, i18n } = useTranslation([
    "shops",
    "characters",
    "upgrades",
    "equipmentItems",
  ])
  const characters = useCatalogDataset("characters", toById)
  const mows = useCatalogDataset("mows", toById)
  if (rewards.length === 0) return null
  const context = {
    t,
    charactersById: characters.status === "ready" ? characters.data : NO_UNITS,
    mowsById: mows.status === "ready" ? mows.data : NO_UNITS,
    equipmentById: NO_UNITS,
  }
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <ul
      className={cn("flex flex-wrap gap-x-2.5 gap-y-1", className)}
      data-testid={testId}
    >
      {sumRewards(rewards).map((reward) => {
        const display = shopRewardDisplay(reward.id, undefined, context)
        const amount =
          reward.min === reward.max
            ? number.format(reward.min)
            : `${number.format(reward.min)}–${number.format(reward.max)}`
        const label = `${display.label} ×${amount}`
        return (
          <li
            key={reward.id}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
            title={label}
            aria-label={label}
            data-reward={reward.id}
          >
            {display.iconUrl ? (
              <EntityIcon alt="" src={display.iconUrl} className="size-5" />
            ) : (
              <span aria-hidden>{display.label}</span>
            )}
            <span aria-hidden>{amount}</span>
          </li>
        )
      })}
    </ul>
  )
}
