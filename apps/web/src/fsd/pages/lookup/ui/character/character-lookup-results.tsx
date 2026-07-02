import { useState } from "react"
import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import {
  campaignIcon,
  campaignShortLabel,
  rarityClass,
  rarityRank,
  statIcon,
  type Rank,
  type Rarity,
  type StatIconKind,
} from "@workspace/game-catalog"

import type {
  CampaignInsight,
  CampaignInsightContribution,
} from "@/features/rank-lookup"
import { EntityIcon, RankBadge, RarityIcon, UpgradeIcon } from "@/shared/ui"

export type LocationView = { id: string; label: string; icon?: string }
export type BaseUpgradeView = {
  id: string
  count: number
  label: string
  rarity: Rarity
  crafted: boolean
  campaignLocations: LocationView[]
  eventLocations: LocationView[]
}
export type RecipeView = {
  id: string
  label: string
  count: number
  rarity: Rarity
  crafted: boolean
  children: RecipeView[]
}
export type UpgradeView = {
  id: string
  label: string
  rarity: Rarity
  crafted: boolean
  recipe: RecipeView[]
}
export type RankGroupView = {
  fromRank: Rank
  toRank: Rank
  pointFive?: boolean
  health: UpgradeView[]
  damage: UpgradeView[]
  armour: UpgradeView[]
}

export function CharacterLookupResults({
  baseUpgrades,
  groups,
  campaignInsights,
  eventInsights,
  isMobile,
}: {
  baseUpgrades: BaseUpgradeView[]
  groups: RankGroupView[]
  campaignInsights: CampaignInsight[]
  eventInsights: CampaignInsight[]
  isMobile: boolean
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
  const topByRarity: BaseUpgradeView[] = []
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
          />
        ) : (
          <BaseUpgradesTable
            baseUpgrades={baseUpgrades}
            highlightedId={highlightedId}
          />
        )}
      </section>
    </div>
  )
}

function TopRarityChip({
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

function CampaignInsightList({
  label,
  insights,
  upgradeById,
}: {
  label: string
  insights: CampaignInsight[]
  upgradeById: ReadonlyMap<string, BaseUpgradeView>
}) {
  const { t } = useTranslation()
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
                        {tier === "standard" ? "S" : "Ext"} {score.toFixed(2)}
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
                  upgradeById
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

interface UpgradeContributionGroup {
  upgradeId: string
  upgrade?: BaseUpgradeView
  count: number
  totalValue: number
  locations: LocationView[]
}

// Collapses a campaign insight's per-(upgrade, location) contributions into one row per upgrade
// (with all its drop locations attached), ordered Mythic → Common so the rarest, most valuable
// upgrades needed from this campaign show up first.
function groupContributionsByUpgrade(
  contributions: CampaignInsightContribution[],
  upgradeById: ReadonlyMap<string, BaseUpgradeView>
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
      const short = campaignShortLabel(
        contribution.campaignGroupId,
        contribution.difficulty
      )
      group.locations.push({
        id: contribution.battleId,
        label: short
          ? `${short.name} ${short.code} ${contribution.nodeNumber}${short.challenge ? "B" : ""}`
          : contribution.campaignGroupId,
        icon: campaignIcon(
          contribution.campaignGroupId,
          contribution.difficulty
        ),
      })
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      rarityRank(b.upgrade?.rarity ?? "Common") -
        rarityRank(a.upgrade?.rarity ?? "Common") || b.totalValue - a.totalValue
  )
}

function BaseUpgradesTable({
  baseUpgrades,
  highlightedId,
}: {
  baseUpgrades: BaseUpgradeView[]
  highlightedId: string | null
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              {t("unitLookup.baseUpgrade")}
            </TableHead>
            <TableHead>{t("unitLookup.name")}</TableHead>
            <TableHead className="w-20 text-right">
              {t("unitLookup.count")}
            </TableHead>
            <TableHead className="w-28">{t("unitLookup.rarity")}</TableHead>
            <TableHead className="max-w-48">
              {t("unitLookup.campaignLocations")}
            </TableHead>
            <TableHead className="max-w-48">
              {t("unitLookup.eventLocations")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {baseUpgrades.map((upgrade) => (
            <TableRow
              key={upgrade.id}
              id={`base-upgrade-${upgrade.id}`}
              className={cn(
                "scroll-mt-4 transition-colors",
                highlightedId === upgrade.id && "bg-primary/10"
              )}
            >
              <TableCell>
                <UpgradeIcon
                  id={upgrade.id}
                  rarity={upgrade.rarity}
                  crafted={upgrade.crafted}
                  className="size-12"
                />
              </TableCell>
              <TableCell className="font-medium">{upgrade.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {upgrade.count}
              </TableCell>
              <TableCell>
                <RarityIcon rarity={upgrade.rarity} />
              </TableCell>
              <TableCell className="max-w-48 whitespace-normal">
                <LocationChips locations={upgrade.campaignLocations} />
              </TableCell>
              <TableCell className="max-w-48 whitespace-normal">
                <LocationChips locations={upgrade.eventLocations} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BaseUpgradesCards({
  baseUpgrades,
  highlightedId,
}: {
  baseUpgrades: BaseUpgradeView[]
  highlightedId: string | null
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      {baseUpgrades.map((upgrade) => (
        <Card
          key={upgrade.id}
          id={`base-upgrade-${upgrade.id}`}
          className={cn(
            "scroll-mt-4 gap-2 py-3 transition-colors",
            highlightedId === upgrade.id && "bg-primary/10"
          )}
        >
          <CardContent className="flex flex-col gap-2 px-3">
            <div className="flex items-center gap-3">
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
            </div>
            <LocationSection
              label={t("unitLookup.campaignLocations")}
              locations={upgrade.campaignLocations}
            />
            <LocationSection
              label={t("unitLookup.eventLocations")}
              locations={upgrade.eventLocations}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LocationSection({
  label,
  locations,
}: {
  label: string
  locations: LocationView[]
}) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <LocationChips locations={locations} />
    </div>
  )
}

function LocationChips({ locations }: { locations: LocationView[] }) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {locations.map((location) => (
        <Badge
          key={location.id}
          variant="outline"
          className="gap-1 font-normal"
        >
          {location.icon ? (
            <EntityIcon src={location.icon} alt="" className="size-4" />
          ) : null}
          {location.label}
        </Badge>
      ))}
    </div>
  )
}

function RankGroupHeader({
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

function RankGroupBody({ group }: { group: RankGroupView }) {
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
