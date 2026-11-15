import { Link, Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ChevronRight, RotateCcw } from "lucide-react"
import {
  factionIcon,
  heroStarIcon,
  mowIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import type { Rarity, UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { RARITY_BORDER, RARITY_TEXT } from "@/entities/incursion"
import { useDateLocale } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import {
  MAX_STARS,
  tierCleared,
  tierRewards,
  tierStarCount,
  type TierStars,
} from "../../model/incursion-progress.model"
import type { Incursion, IncursionTier } from "../../model/incursions.model"
import type { IncursionTierPlan } from "../../model/use-incursion-plans"
import { IncursionEstimate } from "./incursion-estimate"
import { IncursionNavBar } from "./incursion-nav-bar"
import { IncursionPower } from "./incursion-power"
import { IncursionProgressControl } from "./incursion-progress-control"
import { IncursionStarsBar } from "./incursion-stars-bar"
import { IncursionTeam } from "./incursion-team"
import { IncursionTierRewards } from "./incursion-tier-rewards"
import {
  INCURSIONS_PATH,
  incursionPath,
  incursionTierPath,
  neighbours,
  tierGroups,
  useIncursionsOutlet,
  type IncursionProgress,
} from "./incursions-outlet"
import { useTierName } from "./use-tier-name"

const NO_STARS: TierStars = () => 0

/**
 * One tier as the game lists it: its number, its toughest battle's power against the team's, what
 * finishing it still pays, the stars earned with mark-all and reset, and a link to its run map.
 */
function TierCard({
  incursion,
  tier,
  progress,
  power,
}: {
  incursion: Incursion
  tier: IncursionTier
  progress?: IncursionProgress
  power?: IncursionTierPlan
}) {
  const { t } = useTranslation("incursions")
  const tierName = useTierName(incursion)
  const stars = progress?.starsOf(incursion.mowId)
  const count = stars ? tierStarCount(tier, stars) : undefined
  const cleared = stars ? tierCleared(tier, stars) : false
  const testId = `incursion-tier-${tier.index}`
  const to = incursionTierPath(incursion.mowId, tier.index)
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border-2 bg-card px-3 py-2.5",
        RARITY_BORDER[tier.rarity]
      )}
      data-testid={testId}
      data-cleared={cleared || undefined}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <Link
            to={to}
            className="font-semibold tracking-wide uppercase hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            data-testid={`${testId}-open`}
          >
            {t("tier.title", { number: tier.index + 1 })}
          </Link>
          <span className="text-xs text-muted-foreground">
            {tierName(tier.index)}
          </span>
          {power ? (
            <IncursionPower
              power={power.peakPower}
              teamPower={power.team?.power}
              className="text-sm"
              data-testid={`${testId}-power`}
            />
          ) : null}
          {power?.team && !cleared ? (
            <IncursionEstimate
              team={power.team}
              data-testid={`${testId}-estimate`}
            />
          ) : null}
          <IncursionTierRewards
            mowId={incursion.mowId}
            rewards={tierRewards(tier, stars ?? NO_STARS)}
            data-testid={`${testId}-rewards`}
          />
        </div>
        {count ? (
          <IncursionStarsBar
            earned={count.earned}
            max={count.max}
            className="max-w-64"
            data-testid={`${testId}-stars`}
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {progress && count ? (
          count.earned >= count.max ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => progress.setTierStars(incursion.mowId, tier, 0)}
              aria-label={t("tier.resetTier", {
                tier: t("tier.title", { number: tier.index + 1 }),
              })}
              data-testid={`${testId}-reset`}
            >
              <RotateCcw aria-hidden="true" />
              <span className="max-sm:sr-only">{t("tier.reset")}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                progress.setTierStars(incursion.mowId, tier, MAX_STARS)
              }
              aria-label={t("tier.markTier", {
                tier: t("tier.title", { number: tier.index + 1 }),
              })}
              data-testid={`${testId}-mark-cleared`}
            >
              <EntityIcon src={heroStarIcon()} alt="" className="size-4" />
              <span className="max-sm:sr-only">{t("tier.markCleared")}</span>
            </Button>
          )
        ) : null}
        <Button asChild size="sm" variant="ghost">
          <Link to={to} tabIndex={-1} aria-hidden="true">
            <span className="max-sm:sr-only">{t("tier.preview")}</span>
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </li>
  )
}

/**
 * One MoW's Incursion: prev/next between MoWs, its allowed factions, the player's progress, the
 * suggested team, and its tiers grouped by rarity like the game's tier list, each opening its run map.
 */
export function IncursionMowPage() {
  const { mowId } = useParams()
  const { t } = useTranslation([
    "incursions",
    "mows",
    "factions",
    "progression",
  ])
  const dateLocale = useDateLocale()
  const { incursions, ownedMowIds, plans, progress } = useIncursionsOutlet()
  const at = incursions.findIndex((incursion) => incursion.mowId === mowId)
  const incursion = incursions[at]
  if (!incursion) return <Navigate replace to={INCURSIONS_PATH} />

  const nameOf = (id: string) => t(`mows:${id}`, { defaultValue: id })
  const name = nameOf(incursion.mowId)
  const { previous, next } = neighbours(incursions, at)
  const owned = ownedMowIds.has(incursion.mowId)
  const stars = progress?.starsOf(incursion.mowId)
  const plan =
    plans.status === "ready" ? plans.plans.get(incursion.mowId) : undefined
  const firstRun = new Date(incursion.availableFromUtc).toLocaleDateString(
    dateLocale,
    { dateStyle: "medium" }
  )
  const testId = `incursion-${incursion.mowId}`

  return (
    <div className="flex flex-col gap-4" data-testid={`${testId}-page`}>
      <IncursionNavBar
        back={{ to: INCURSIONS_PATH, label: t("nav.overview") }}
        breadcrumb={[t("nav.overview"), name]}
        previous={
          previous && {
            to: incursionPath(previous.mowId),
            name: nameOf(previous.mowId),
          }
        }
        next={
          next && { to: incursionPath(next.mowId), name: nameOf(next.mowId) }
        }
        position={t("nav.position", {
          index: at + 1,
          total: incursions.length,
        })}
      />

      <header className="flex items-center gap-3">
        <EntityIcon
          src={mowIcon(incursion.mowId as UnitId)}
          alt=""
          className="size-16 shrink-0 rounded-sm"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-xl font-semibold">{name}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {incursion.new ? <Badge>{t("card.new")}</Badge> : null}
            {incursion.updated ? (
              <Badge variant="secondary">{t("card.revamped")}</Badge>
            ) : null}
            <Badge
              variant="outline"
              className={owned ? undefined : "text-muted-foreground"}
              data-testid={`${testId}-owned`}
            >
              {owned ? t("card.owned") : t("card.notOwned")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {t("card.firstRun", { date: firstRun })}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t("card.allowedFactions")}</h3>
        <ul
          className="flex flex-wrap gap-1.5"
          data-testid={`${testId}-factions`}
        >
          {incursion.allowedFactions.map((faction) => {
            const label = t(`factions:${faction}`, { defaultValue: faction })
            return (
              <li key={faction} title={label}>
                <EntityIcon
                  src={factionIcon(faction)}
                  alt={label}
                  className="size-8"
                />
              </li>
            )
          })}
        </ul>
      </div>

      <IncursionTeam incursion={incursion} plans={plans} />
      {stars ? (
        <IncursionProgressControl incursion={incursion} stars={stars} />
      ) : null}

      <section
        className="space-y-4"
        aria-label={t("tier.list")}
        data-testid={`${testId}-tiers`}
      >
        {tierGroups(incursion.tiers).map((group) => (
          <div key={group.rarity} className="space-y-2">
            <h3
              className={cn(
                "flex items-center gap-2 text-sm font-semibold tracking-wide uppercase",
                RARITY_TEXT[group.rarity]
              )}
            >
              <EntityIcon
                src={rarityIcon(group.rarity as Rarity)}
                alt=""
                className="size-5"
              />
              {t(`progression:rarities.${group.rarity}` as never, {
                defaultValue: group.rarity,
              })}
            </h3>
            <ul className="space-y-2">
              {group.tiers.map((tier) => (
                <TierCard
                  key={tier.index}
                  incursion={incursion}
                  tier={tier}
                  progress={progress}
                  power={plan?.tiers.get(tier.index)}
                />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
