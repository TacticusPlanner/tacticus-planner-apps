import { useTranslation } from "react-i18next"
import { shardIcon } from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { shopRewardDisplay, type ShopRewardKind } from "@/features/shop-rewards"
import { toById, useCatalogDataset } from "@/shared/local-data"
import { EntityIcon, UpgradeIcon } from "@/shared/ui"

import { sumRewards } from "../../model/incursions.model"

const NO_UNITS = new Map<string, { name: string }>()

/**
 * A reward's icon as the game frames it: an upgrade on its rarity frame, a unit's shards as its
 * portrait with a shard (or mythic shard) badge, anything else as its plain icon.
 */
function RewardIcon({
  id,
  kind,
  iconUrl,
  upgrade,
}: {
  id: string
  kind: ShopRewardKind
  iconUrl: NonNullable<ReturnType<typeof shopRewardDisplay>["iconUrl"]>
  upgrade?: {
    rarity: Parameters<typeof UpgradeIcon>[0]["rarity"]
    craftable: boolean
  }
}) {
  if (kind === "upgrade") {
    return (
      <UpgradeIcon
        id={id as UpgradeId}
        rarity={upgrade?.rarity}
        crafted={upgrade?.craftable}
        className="size-6"
      />
    )
  }
  if (kind === "shard" || kind === "mythicShard") {
    const mythic = kind === "mythicShard"
    return (
      <span
        className="relative inline-block size-6 shrink-0"
        data-shard={mythic ? "mythic" : "regular"}
      >
        <EntityIcon
          alt=""
          src={iconUrl}
          className={cn(
            "size-full rounded-sm border",
            mythic ? "border-(--rarity-mythic)" : "border-(--rarity-legendary)"
          )}
        />
        <EntityIcon
          alt=""
          src={shardIcon(mythic ? "Mythic" : "Regular")}
          className="absolute -right-1 -bottom-1 size-3.5"
        />
      </span>
    )
  }
  return <EntityIcon alt="" src={iconUrl} className="size-5" />
}

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
  const upgrades = useCatalogDataset("upgrades", toById)
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
              <RewardIcon
                id={reward.id}
                kind={display.kind}
                iconUrl={display.iconUrl}
                upgrade={
                  upgrades.status === "ready"
                    ? upgrades.data.get(reward.id)
                    : undefined
                }
              />
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
