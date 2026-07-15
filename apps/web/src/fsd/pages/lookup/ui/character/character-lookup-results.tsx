import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { Rarity } from "@workspace/game-domain"

import type { CampaignInsight } from "@/shared/lib"

import {
  BaseUpgradesCards,
  BaseUpgradesTable,
} from "./character-lookup-base-upgrades"
import { CampaignInsightList, TopRarityChip } from "./character-lookup-insights"
import { RankGroupBody, RankGroupHeader } from "./character-lookup-rank-groups"
import type {
  BaseUpgradeViewModel,
  RankGroupViewModel,
} from "./character-lookup-results.view-model"

export function CharacterLookupResults({
  baseUpgrades,
  groups,
  campaignInsights,
  eventInsights,
  isMobile,
  showOwned,
}: {
  baseUpgrades: BaseUpgradeViewModel[]
  groups: RankGroupViewModel[]
  campaignInsights: CampaignInsight[]
  eventInsights: CampaignInsight[]
  isMobile: boolean
  /** Whether to show the Owned/Missing columns (table) or fields (cards) in the Base Upgrades
   *  section below — hidden while signed out, since Owned is always 0 and Missing always equals
   *  Count in that state (see character-lookup-page.tsx's effectiveIncludeOwned). */
  showOwned: boolean
}) {
  const { t } = useTranslation()
  // Set by clicking a "top upgrade by rarity" insight chip; briefly highlights the matching row/
  // card in the Base Upgrades section below after scrolling to it.
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  if (baseUpgrades.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {t("unitLookup.noUpgrades")}
      </p>
    )
  }

  // baseUpgrades is already sorted rarity desc, count desc (see character-lookup-page.tsx), so the
  // first entry seen per rarity is that rarity's highest-count need.
  const topByRarity: BaseUpgradeViewModel[] = []
  const seenRarities = new Set<Rarity>()
  for (const upgrade of baseUpgrades) {
    if (!seenRarities.has(upgrade.rarity)) {
      seenRarities.add(upgrade.rarity)
      topByRarity.push(upgrade)
    }
  }
  const upgradeById = new Map(baseUpgrades.map((u) => [u.id, u]))

  const scrollToUpgrade = (id: string) => {
    document
      .getElementById(`base-upgrade-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
    setHighlightedId(id)
    window.setTimeout(
      () => setHighlightedId((current) => (current === id ? null : current)),
      1500
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("unitLookup.insights")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t("unitLookup.topUpgradesByRarity")}
            </span>
            <div
              className={cn("flex gap-2", isMobile ? "flex-col" : "flex-wrap")}
            >
              {topByRarity.map((upgrade) => (
                <TopRarityChip
                  key={upgrade.id}
                  upgrade={upgrade}
                  isMobile={isMobile}
                  onClick={() => scrollToUpgrade(upgrade.id)}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignInsightList
              label={t("unitLookup.usefulCampaigns")}
              insights={campaignInsights}
              upgradeById={upgradeById}
            />
            <CampaignInsightList
              label={t("unitLookup.usefulEvents")}
              insights={eventInsights}
              upgradeById={upgradeById}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("unitLookup.byRank")}</h2>
        {isMobile ? (
          <Accordion type="multiple" className="w-full">
            {groups.map((group, index) => (
              <AccordionItem key={index} value={String(index)}>
                <AccordionTrigger>
                  <RankGroupHeader group={group} />
                </AccordionTrigger>
                <AccordionContent>
                  <RankGroupBody group={group} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
            {groups.map((group, index) => (
              <Card key={index} className="gap-3 py-4">
                <CardHeader className="flex justify-center px-4">
                  <RankGroupHeader group={group} compact />
                </CardHeader>
                <CardContent className="px-4">
                  <RankGroupBody group={group} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t("unitLookup.baseUpgrades")}
        </h2>
        {isMobile ? (
          <BaseUpgradesCards
            baseUpgrades={baseUpgrades}
            highlightedId={highlightedId}
            showOwned={showOwned}
          />
        ) : (
          <BaseUpgradesTable
            baseUpgrades={baseUpgrades}
            highlightedId={highlightedId}
            showOwned={showOwned}
          />
        )}
      </section>
    </div>
  )
}
