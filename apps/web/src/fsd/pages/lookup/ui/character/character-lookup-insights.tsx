import { Card, CardContent } from "@workspace/ui/components/card"
import type { UpgradeId } from "@workspace/game-domain"

import { RarityIcon, UpgradeIcon } from "@/shared/ui"
import {
  CampaignInsightList as SharedCampaignInsightList,
  type CampaignInsight,
} from "@/features/campaign-insights"

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
        className="cursor-pointer gap-2 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
      >
        <CardContent className="flex items-center gap-3 px-3">
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
            className="size-15"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{upgrade.label}</p>
            <RarityIcon rarity={upgrade.rarity} className="size-8" />
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
      className="flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      <UpgradeIcon
        id={upgrade.id}
        rarity={upgrade.rarity}
        crafted={upgrade.crafted}
        className="size-10 shrink-0"
      />
      <div className="flex min-w-0 flex-col">
        <RarityIcon rarity={upgrade.rarity} className="size-4" />
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
