import { Link, Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Check, ChevronRight, X } from "lucide-react"
import {
  factionIcon,
  mowIcon,
  powerIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import type { Rarity, UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { useDateLocale } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import type { TierRunEstimate } from "../../model/incursion-plan.model"
import {
  tierCleared,
  tierStarCount,
  type TierStars,
} from "../../model/incursion-progress.model"
import type { Incursion, IncursionTier } from "../../model/incursions.model"
import { IncursionNavBar } from "./incursion-nav-bar"
import { IncursionProgressControl } from "./incursion-progress-control"
import { IncursionStarsBar } from "./incursion-stars-bar"
import { IncursionTeam } from "./incursion-team"
import {
  INCURSIONS_PATH,
  incursionPath,
  incursionTierPath,
  neighbours,
  tierGroups,
  useIncursionsOutlet,
} from "./incursions-outlet"
import { useTierName } from "./use-tier-name"

const RARITY_FRAME: Record<string, string> = {
  Common: "border-zinc-400/60",
  Uncommon: "border-emerald-500/60",
  Rare: "border-sky-500/60",
  Epic: "border-violet-500/60",
  Legendary: "border-amber-500/60",
  Mythic: "border-rose-500/60",
}

/** One tier as the game lists it: its number, the power it takes, the stars earned, and a link in. */
function TierCard({
  incursion,
  tier,
  stars,
  estimate,
}: {
  incursion: Incursion
  tier: IncursionTier
  stars?: TierStars
  estimate?: TierRunEstimate
}) {
  const { t, i18n } = useTranslation("incursions")
  const tierName = useTierName(incursion)
  const number = new Intl.NumberFormat(i18n.language)
  const count = stars ? tierStarCount(tier, stars) : undefined
  const cleared = stars ? tierCleared(tier, stars) : false
  const testId = `incursion-tier-${tier.index}`
  return (
    <li data-testid={testId}>
      <Link
        to={incursionTierPath(incursion.mowId, tier.index)}
        className={cn(
          "flex items-center gap-3 rounded-lg border-2 bg-card px-3 py-2.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          RARITY_FRAME[tier.rarity]
        )}
        data-testid={`${testId}-open`}
        data-cleared={cleared || undefined}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-semibold tracking-wide uppercase">
              {t("tier.title", { number: tier.index + 1 })}
            </span>
            <span className="text-xs text-muted-foreground">
              {tierName(tier.index)}
            </span>
            {estimate ? (
              <span
                className="flex items-center gap-1 text-sm tabular-nums"
                title={t("tier.peakPowerHint")}
                data-testid={`${testId}-power`}
              >
                <EntityIcon src={powerIcon()} alt="" className="size-4" />
                {number.format(Math.round(estimate.peakPower))}
              </span>
            ) : null}
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
        {estimate ? (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1",
              estimate.cleared
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400"
            )}
            title={t("estimate.hint")}
            data-testid={`${testId}-estimate`}
          >
            {estimate.cleared ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <X className="size-3" aria-hidden="true" />
            )}
            {estimate.cleared
              ? t("tier.estimateClears")
              : t("tier.estimateStops", {
                  battle: estimate.wins + 1,
                  total: estimate.battles,
                })}
          </Badge>
        ) : null}
        <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground">
          <span className="max-sm:sr-only">{t("tier.preview")}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
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
  const estimates =
    plans.status === "ready"
      ? plans.plans.get(incursion.mowId)?.tiers
      : undefined
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
          className="size-16 shrink-0 rounded"
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

      {stars ? (
        <IncursionProgressControl incursion={incursion} stars={stars} />
      ) : null}
      <IncursionTeam incursion={incursion} plans={plans} />

      <section
        className="space-y-4"
        aria-label={t("tier.list")}
        data-testid={`${testId}-tiers`}
      >
        {tierGroups(incursion.tiers).map((group) => (
          <div key={group.rarity} className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
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
                  stars={stars}
                  estimate={estimates?.get(tier.index)}
                />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
