import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { rarityClass, statIcon } from "@workspace/game-catalog"
import type { StatIconKind } from "@workspace/game-catalog"

import { EntityIcon, RankBadge, UpgradeIcon } from "@/shared/ui"

import type {
  RankGroupViewModel,
  RecipeViewModel,
  UpgradeViewModel,
} from "./character-lookup-results.view-model"

export function RankGroupHeader({
  group,
  compact = false,
}: {
  group: RankGroupViewModel
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <RankBadge rank={group.fromRank} size="icon-lg" showLabel={!compact} />
      {group.pointFive ? (
        <Badge variant="secondary">{t("unitLookup.pointFiveShort")}</Badge>
      ) : (
        <>
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
          <RankBadge rank={group.toRank} size="icon-lg" showLabel={!compact} />
        </>
      )}
    </div>
  )
}

export function RankGroupBody({ group }: { group: RankGroupViewModel }) {
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
  upgrades: UpgradeViewModel[]
}) {
  if (upgrades.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-1.5">
      <EntityIcon
        size="icon-lg"
        src={statIcon(stat)}
        alt={stat}
        className="opacity-80"
      />
      {upgrades.map((upgrade) => (
        <UpgradeCell key={upgrade.id} upgrade={upgrade} />
      ))}
    </div>
  )
}

function UpgradeCell({ upgrade }: { upgrade: UpgradeViewModel }) {
  const { t } = useTranslation()
  const hasRecipe = upgrade.recipe.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            upgrade.owned
              ? `${upgrade.label} (${t("unitLookup.alreadyApplied")})`
              : upgrade.label
          }
          className="relative rounded-sm interactive-surface"
        >
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
            size="icon-2xl"
            className={cn(upgrade.owned && "opacity-50")}
          />
          {upgrade.owned ? (
            <CheckCircle2
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 size-icon rounded-full bg-background text-primary"
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className={cn("flex items-center gap-2", hasRecipe && "pb-2")}>
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
          />
          <span className={cn("font-medium", rarityClass(upgrade.rarity))}>
            {upgrade.label}
          </span>
          {upgrade.owned ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-icon-xs" aria-hidden="true" />
              {t("unitLookup.alreadyApplied")}
            </Badge>
          ) : null}
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
  items: RecipeViewModel[]
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
