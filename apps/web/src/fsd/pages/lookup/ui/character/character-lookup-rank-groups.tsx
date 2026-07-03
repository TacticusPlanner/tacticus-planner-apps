import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  rarityClass,
  statIcon,
  type StatIconKind,
} from "@workspace/game-catalog"

import { EntityIcon, RankBadge, UpgradeIcon } from "@/shared/ui"

import type {
  RankGroupView,
  RecipeView,
  UpgradeView,
} from "./character-lookup-results.types"

export function RankGroupHeader({
  group,
  compact = false,
}: {
  group: RankGroupView
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <RankBadge
        rank={group.fromRank}
        iconClassName="size-8"
        showLabel={!compact}
      />
      {group.pointFive ? (
        <Badge variant="secondary">{t("unitLookup.pointFiveShort")}</Badge>
      ) : (
        <>
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
          <RankBadge
            rank={group.toRank}
            iconClassName="size-8"
            showLabel={!compact}
          />
        </>
      )}
    </div>
  )
}

export function RankGroupBody({ group }: { group: RankGroupView }) {
  return (
    <div className="flex justify-center gap-4">
      <StatColumn stat="health" upgrades={group.health} />
      <StatColumn stat="damage" upgrades={group.damage} />
      <StatColumn stat="armour" upgrades={group.armour} />
    </div>
  )
}

function StatColumn({
  stat,
  upgrades,
}: {
  stat: StatIconKind
  upgrades: UpgradeView[]
}) {
  if (upgrades.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-1.5">
      <EntityIcon
        src={statIcon(stat)}
        alt={stat}
        className="size-8 opacity-80"
      />
      {upgrades.map((upgrade) => (
        <UpgradeCell key={upgrade.id} upgrade={upgrade} />
      ))}
    </div>
  )
}

function UpgradeCell({ upgrade }: { upgrade: UpgradeView }) {
  const hasRecipe = upgrade.recipe.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={upgrade.label}
          className="rounded-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
            className="size-12"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className={cn("flex items-center gap-2", hasRecipe && "pb-2")}>
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
          />
          <span className={cn("font-medium", rarityClass(upgrade.rarity))}>
            {upgrade.label}
          </span>
        </div>
        {hasRecipe ? <RecipeTree items={upgrade.recipe} /> : null}
      </PopoverContent>
    </Popover>
  )
}

function RecipeTree({
  items,
  depth = 0,
}: {
  items: RecipeView[]
  depth?: number
}) {
  return (
    <ul
      className={cn(
        "flex flex-col gap-1",
        depth > 0 && "ml-3 border-l border-border pl-3"
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <UpgradeIcon
              id={item.id}
              rarity={item.rarity}
              crafted={item.crafted}
              className="size-9"
            />
            <span className={rarityClass(item.rarity)}>{item.label}</span>
            <span className="text-muted-foreground tabular-nums">
              ×{item.count}
            </span>
          </div>
          {item.children.length > 0 ? (
            <RecipeTree items={item.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}
