import { useMemo } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { RotateCcw } from "lucide-react"
import { heroStarIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon } from "@/shared/ui"

import {
  MAX_STARS,
  tierChestRewards,
  tierCleared,
  tierRewards,
  tierStarCount,
  tierUnclaimedRewards,
} from "../../model/incursion-progress.model"
import { runSteps, shardYield, tierSummary } from "../../model/incursions.model"
import { IncursionEstimate } from "./incursion-estimate"
import { IncursionNavBar } from "./incursion-nav-bar"
import { IncursionPower } from "./incursion-power"
import { IncursionRewards } from "./incursion-rewards"
import { IncursionRunMap } from "./incursion-run-map"
import { IncursionTierRewards } from "./incursion-tier-rewards"
import { IncursionStarsBar } from "./incursion-stars-bar"
import {
  INCURSIONS_PATH,
  incursionPath,
  incursionTierPath,
  neighbours,
  tierByNumber,
  useIncursionsOutlet,
} from "./incursions-outlet"
import { useTierName } from "./use-tier-name"

/**
 * One tier's page: prev/next between the MoW's tiers, the stars earned with whole-tier mark and
 * reset, its totals and the run map step by step. With progress, a cleared tier shows what a replay
 * pays (its chests; star rewards are paid once) and an open tier shows the one-time shards it holds.
 */
export function IncursionTierPage() {
  const { mowId, tier: tierNumber } = useParams()
  const { t } = useTranslation(["incursions", "mows"])
  const { incursions, npcsById, plans, progress } = useIncursionsOutlet()
  const incursion = incursions.find((candidate) => candidate.mowId === mowId)
  const tierName = useTierName(incursion)
  const tier = incursion ? tierByNumber(incursion, tierNumber) : undefined
  const view = useMemo(
    () =>
      incursion && tier
        ? {
            summary: tierSummary(incursion.mowId, tier),
            steps: runSteps(tier),
            battlesById: new Map(
              tier.battles.map((battle) => [battle.id, battle])
            ),
          }
        : undefined,
    [incursion, tier]
  )
  if (!incursion) return <Navigate replace to={INCURSIONS_PATH} />
  if (!tier || !view)
    return <Navigate replace to={incursionPath(incursion.mowId)} />

  const { summary } = view
  const stars = progress?.starsOf(incursion.mowId)
  const plan =
    plans.status === "ready" ? plans.plans.get(incursion.mowId) : undefined
  const power = plan?.tiers.get(tier.index)
  const teamPower = power?.team?.power
  const cleared = stars ? tierCleared(tier, stars) : false
  const count = stars ? tierStarCount(tier, stars) : undefined
  const oneTimeLeft = stars
    ? shardYield(incursion.mowId, tierUnclaimedRewards(tier, stars))
    : undefined
  const at = incursion.tiers.indexOf(tier)
  const { previous, next } = neighbours(incursion.tiers, at)
  const title = t("tier.title", { number: tier.index + 1 })
  const mowName = t(`mows:${incursion.mowId}`, {
    defaultValue: incursion.mowId,
  })
  const tierTarget = (target: typeof tier | undefined) =>
    target && {
      to: incursionTierPath(incursion.mowId, target.index),
      name: t("tier.title", { number: target.index + 1 }),
    }

  return (
    <div className="flex flex-col gap-4" data-testid="incursion-tier">
      <IncursionNavBar
        back={{ to: incursionPath(incursion.mowId), label: mowName }}
        breadcrumb={[t("nav.overview"), mowName, title]}
        previous={tierTarget(previous)}
        next={tierTarget(next)}
        position={t("nav.position", {
          index: at + 1,
          total: incursion.tiers.length,
        })}
      />
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="space-y-0.5">
          <h2
            className="text-xl font-semibold tracking-wide uppercase"
            data-testid="incursion-tier-title"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tierName(tier.index)}
          </p>
        </div>
        {power ? (
          <IncursionPower
            power={power.peakPower}
            teamPower={teamPower}
            data-testid="incursion-tier-power"
          />
        ) : null}
        <IncursionTierRewards
          mowId={incursion.mowId}
          rewards={tierRewards(tier, stars ?? (() => 0))}
          data-testid="incursion-tier-rewards"
        />
        <ul
          className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground tabular-nums"
          data-testid="incursion-tier-summary"
        >
          <li>{t("summary.battles", { count: summary.battles })}</li>
          {summary.challenges > 0 ? (
            <li>{t("summary.challenges", { count: summary.challenges })}</li>
          ) : null}
          <li>{t("summary.chests", { count: summary.chests })}</li>
          <li>{t("summary.enhancements", { count: summary.enhancements })}</li>
        </ul>
      </header>
      {power?.team && !cleared ? (
        <IncursionEstimate
          team={power.team}
          detailed
          data-testid="incursion-tier-estimate"
        />
      ) : null}
      {progress && count ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3"
          data-testid="incursion-tier-progress"
        >
          <IncursionStarsBar
            earned={count.earned}
            max={count.max}
            className="w-full max-w-72"
            data-testid="incursion-tier-stars"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={count.earned >= count.max}
              onClick={() =>
                progress.setTierStars(incursion.mowId, tier, MAX_STARS)
              }
              data-testid="incursion-tier-mark-cleared"
            >
              <EntityIcon src={heroStarIcon()} alt="" className="size-4" />
              {t("tier.markCleared")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={count.earned === 0}
              onClick={() => progress.setTierStars(incursion.mowId, tier, 0)}
              data-testid="incursion-tier-reset"
            >
              <RotateCcw aria-hidden="true" />
              {t("tier.reset")}
            </Button>
          </div>
          <p className="w-full text-xs text-muted-foreground">
            {t("tier.markHint")}
          </p>
        </div>
      ) : null}
      {cleared ? (
        <div className="space-y-1.5" data-testid="incursion-replay-rewards">
          <p className="text-sm font-medium">{t("progress.replayTitle")}</p>
          <IncursionRewards rewards={tierChestRewards(tier)} />
          <p className="text-xs text-muted-foreground">
            {t("progress.replayHint")}
          </p>
        </div>
      ) : (
        <p
          className="text-sm font-medium"
          title={t("summary.bestPathHint")}
          data-testid="incursion-best-path"
        >
          {summary.bestPath.mythicShards > 0
            ? t("summary.bestPathMythic", summary.bestPath)
            : t("summary.bestPath", { shards: summary.bestPath.shards })}
          <span className="block text-xs font-normal text-muted-foreground">
            {t("summary.bestPathHint")}
          </span>
        </p>
      )}
      {oneTimeLeft &&
      (oneTimeLeft.shards > 0 || oneTimeLeft.mythicShards > 0) ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="incursion-tier-one-time"
        >
          {oneTimeLeft.mythicShards > 0
            ? t("progress.tierOneTimeMythic", oneTimeLeft)
            : t("progress.tierOneTime", { shards: oneTimeLeft.shards })}
        </p>
      ) : null}

      <IncursionRunMap
        key={tier.index}
        incursion={incursion}
        tier={tier}
        steps={view.steps}
        battlesById={view.battlesById}
        npcsById={npcsById}
        stars={stars}
        onStarsChange={
          progress
            ? (battleId, value) =>
                progress.setBattleStars(
                  incursion.mowId,
                  tier.index,
                  battleId,
                  value
                )
            : undefined
        }
        battlePowers={power?.battles}
        teamPower={teamPower}
      />
    </div>
  )
}
