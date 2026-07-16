import { Info } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { rarityRank, type Rarity, type UpgradeId } from "@workspace/game-domain"

import {
  useCampaignDisplay,
  type CampaignInsight,
  type CampaignInsightContribution,
} from "@/shared/lib"
import { EntityIcon, LocationChips, UpgradeIcon } from "@/shared/ui"

export type CampaignInsightResource = {
  id: string
  label: string
  rarity?: Rarity
  crafted?: boolean
}

export function CampaignInsightList<TId extends string>({
  label,
  insights,
  resourceById,
  renderFooter,
}: {
  label: string
  insights: CampaignInsight<TId>[]
  resourceById: ReadonlyMap<TId, CampaignInsightResource>
  renderFooter?: (insight: CampaignInsight<TId>) => ReactNode
}) {
  const { t } = useTranslation()
  const { shortLabel, tierCode } = useCampaignDisplay()
  if (!insights.length) return null

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
                {insight.tierScores?.length ? (
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
                {groupContributions(
                  insight.contributions,
                  resourceById,
                  shortLabel
                ).map((group) => (
                  <li
                    key={group.id}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    {group.resource?.rarity ? (
                      <UpgradeIcon
                        id={group.id as unknown as UpgradeId}
                        rarity={group.resource.rarity}
                        crafted={group.resource.crafted ?? false}
                        className="size-6 shrink-0"
                      />
                    ) : null}
                    <span className="shrink-0 truncate">
                      {group.resource?.label ?? group.id}
                      <span className="text-muted-foreground">
                        {" "}
                        ×{group.count}
                      </span>
                    </span>
                    <LocationChips locations={group.locations} />
                  </li>
                ))}
              </ul>
              {renderFooter?.(insight)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function groupContributions<TId extends string>(
  contributions: CampaignInsightContribution<TId>[],
  resources: ReadonlyMap<TId, CampaignInsightResource>,
  shortLabel: ReturnType<typeof useCampaignDisplay>["shortLabel"]
) {
  const groups = new Map<
    TId,
    {
      id: TId
      resource?: CampaignInsightResource
      count: number
      value: number
      locations: { id: string; label: string; icon?: string }[]
    }
  >()
  for (const contribution of contributions) {
    const group = groups.get(contribution.upgradeId) ?? {
      id: contribution.upgradeId,
      resource: resources.get(contribution.upgradeId),
      count: contribution.count,
      value: 0,
      locations: [],
    }
    group.value += contribution.value
    if (
      !group.locations.some((location) => location.id === contribution.battleId)
    ) {
      const descriptor = campaignDescriptor(
        contribution.campaignGroupId,
        contribution.type,
        contribution.challenge
      )
      const short = descriptor ? shortLabel(descriptor) : null
      group.locations.push({
        id: contribution.battleId,
        label: short
          ? `${short.name} ${short.code} ${contribution.nodeNumber}${short.challenge ? "B" : ""}`
          : contribution.campaignGroupId,
        icon: campaignIcon(
          contribution.campaignGroupId,
          contribution.type,
          contribution.challenge
        ),
      })
    }
    groups.set(contribution.upgradeId, group)
  }
  return [...groups.values()].sort(
    (a, b) =>
      rarityRank(b.resource?.rarity ?? "Common") -
        rarityRank(a.resource?.rarity ?? "Common") || b.value - a.value
  )
}
