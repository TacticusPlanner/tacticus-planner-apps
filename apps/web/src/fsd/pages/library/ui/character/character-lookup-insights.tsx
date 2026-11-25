import { Card, CardContent } from "@workspace/ui/components/card"
import type { UpgradeId } from "@workspace/game-domain"

import { RarityIcon, UpgradeIcon } from "@/shared/ui"
import { CampaignInsightList as SharedCampaignInsightList } from "@/entities/campaign-insight"
import type { CampaignInsight } from "@/entities/campaign-insight"

import type { BaseUpgradeViewModel } from "./character-lookup-results.view-model"

export function TopRarityChip({
  upgrade,
  isMobile,
  onClick,
}: {
  upgrade: BaseUpgradeViewModel
  isMobile: boolean
  onClick: () => void
}) {
  // On mobile, match the Base Upgrades card layout below (same icon size, name/rarity/count
  // arrangement) so the two sections read as one visual family.
  if (isMobile) {
    return (
      <Card
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick()
          }
        }}
        className="cursor-pointer gap-2 interactive-surface py-3"
      >
        <CardContent className="flex items-center gap-3 px-3">
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
            size="icon-2xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{upgrade.label}</p>
            <RarityIcon rarity={upgrade.rarity} size="icon-lg" />
          </div>
          <span className="text-lg font-semibold tabular-nums">
            ×{upgrade.count}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border interactive-surface px-2 py-1.5 text-left"
    >
      <UpgradeIcon
        id={upgrade.id}
        rarity={upgrade.rarity}
        crafted={upgrade.crafted}
        size="icon-2xl"
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col">
        <RarityIcon rarity={upgrade.rarity} />
        <span className="max-w-32 truncate text-sm font-medium">
          {upgrade.label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          ×{upgrade.count}
        </span>
      </div>
    </button>
  )
}

export function CampaignInsightList({
  label,
  insights,
  upgradeById,
}: {
  label: string
  insights: CampaignInsight[]
  upgradeById: ReadonlyMap<UpgradeId, BaseUpgradeViewModel>
}) {
  return (
    <SharedCampaignInsightList
      label={label}
      insights={insights}
      resourceById={upgradeById}
    />
  )
}
