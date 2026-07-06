import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  campaignDescriptor,
  campaignIcon,
  rarityRank,
  type CampaignDescriptor,
} from "@workspace/game-catalog"

import {
  useCampaignDisplay,
  type CampaignInsight,
  type CampaignInsightContribution,
  type CampaignShortLabel,
} from "@/shared/lib"
import { EntityIcon, LocationChips, RarityIcon, UpgradeIcon } from "@/shared/ui"

import type { BaseUpgradeView } from "./character-lookup-results.types"

type ShortLabelResolver = (descriptor: CampaignDescriptor) => CampaignShortLabel

export function TopRarityChip({
  upgrade,
  isMobile,
  onClick,
}: {
  upgrade: BaseUpgradeView
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
  upgradeById: ReadonlyMap<string, BaseUpgradeView>
}) {
  const { t } = useTranslation(["common"])
  const { shortLabel, tierCode } = useCampaignDisplay()
  if (insights.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("unitLookup.usefulnessScoreHint")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {t("unitLookup.usefulnessScoreHint")}
          </TooltipContent>
        </Tooltip>
      </div>
      <Accordion type="multiple">
        {insights.map((insight, index) => (
          <AccordionItem key={insight.id} value={insight.id}>
            <AccordionTrigger className="items-center py-2 text-sm hover:no-underline">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="w-4 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <EntityIcon
                  src={insight.icon}
                  alt=""
                  className="size-6 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate">{insight.label}</span>
                {insight.tierScores && insight.tierScores.length > 0 ? (
                  <span className="flex shrink-0 gap-2 text-xs text-muted-foreground tabular-nums">
                    {insight.tierScores.map(({ tier, score }) => (
                      <span key={tier}>
                        {tierCode(tier)} {score.toFixed(2)}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {insight.score.toFixed(2)}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-2">
                {groupContributionsByUpgrade(
                  insight.contributions,
                  upgradeById,
                  shortLabel
                ).map((group) => (
                  <li
                    key={group.upgradeId}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    {group.upgrade ? (
                      <UpgradeIcon
                        id={group.upgrade.id}
                        rarity={group.upgrade.rarity}
                        crafted={group.upgrade.crafted}
                        className="size-6 shrink-0"
                      />
                    ) : null}
                    <span className="shrink-0 truncate">
                      {group.upgrade?.label ?? group.upgradeId}
                      <span className="text-muted-foreground">
                        {" "}
                        ×{group.count}
                      </span>
                    </span>
                    <LocationChips locations={group.locations} />
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

interface ContributionLocation {
  id: string
  label: string
  icon?: string
}

interface UpgradeContributionGroup {
  upgradeId: string
  upgrade?: BaseUpgradeView
  count: number
  totalValue: number
  locations: ContributionLocation[]
}

// Collapses a campaign insight's per-(upgrade, location) contributions into one row per upgrade
// (with all its drop locations attached), ordered Mythic → Common so the rarest, most valuable
// upgrades needed from this campaign show up first.
function groupContributionsByUpgrade(
  contributions: CampaignInsightContribution[],
  upgradeById: ReadonlyMap<string, BaseUpgradeView>,
  shortLabel: ShortLabelResolver
): UpgradeContributionGroup[] {
  const groups = new Map<string, UpgradeContributionGroup>()
  for (const contribution of contributions) {
    let group = groups.get(contribution.upgradeId)
    if (!group) {
      group = {
        upgradeId: contribution.upgradeId,
        upgrade: upgradeById.get(contribution.upgradeId),
        count: contribution.count,
        totalValue: 0,
        locations: [],
      }
      groups.set(contribution.upgradeId, group)
    }
    group.totalValue += contribution.value
    // A given battle can appear more than once in the raw contributions (e.g. a location listed
    // twice in the catalog) — dedupe so it isn't shown as a repeated location badge.
    if (!group.locations.some((l) => l.id === contribution.battleId)) {
      group.locations.push(buildLocation(contribution, shortLabel))
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      rarityRank(b.upgrade?.rarity ?? "Common") -
        rarityRank(a.upgrade?.rarity ?? "Common") || b.totalValue - a.totalValue
  )
}

function buildLocation(
  contribution: CampaignInsightContribution,
  shortLabel: ShortLabelResolver
): ContributionLocation {
  const descriptor = campaignDescriptor(
    contribution.campaignGroupId,
    contribution.type,
    contribution.challenge
  )
  const short = descriptor ? shortLabel(descriptor) : null
  return {
    id: contribution.battleId,
    label: short
      ? `${short.name} ${short.code} ${contribution.nodeNumber}${short.challenge ? "B" : ""}`
      : contribution.campaignGroupId,
    icon: campaignIcon(
      contribution.campaignGroupId,
      contribution.type,
      contribution.challenge
    ),
  }
}
