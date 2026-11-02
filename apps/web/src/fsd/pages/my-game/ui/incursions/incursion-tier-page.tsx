import { useMemo } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { RotateCcw } from "lucide-react"
import { heroStarIcon, powerIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon } from "@/shared/ui"

import {
  MAX_STARS,
  tierChestRewards,
  tierCleared,
  tierStarCount,
  tierUnclaimedRewards,
} from "../../model/incursion-progress.model"
import {
  runSteps,
  shardYield,
  tierSummary,
  type IncursionNode,
} from "../../model/incursions.model"
import { IncursionNavBar } from "./incursion-nav-bar"
import { IncursionNodeCard } from "./incursion-node-card"
import { IncursionRewards } from "./incursion-rewards"
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
  const { t, i18n } = useTranslation(["incursions", "mows"])
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
            namesByIndex: new Map(
              tier.nodes.map((node) => [node.index, node.name])
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
  const estimate =
    plans.status === "ready"
      ? plans.plans.get(incursion.mowId)?.tiers.get(tier.index)
      : undefined
  const battleProgress = (node: IncursionNode) => {
    const battleId = node.kind === "battle" ? node.battleId : undefined
    if (!progress || !stars || !battleId) return undefined
    return {
      stars: stars(tier.index, battleId),
      onChange: (value: number) =>
        progress.setBattleStars(incursion.mowId, tier.index, battleId, value),
    }
  }
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
  const number = new Intl.NumberFormat(i18n.language)

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
        {estimate ? (
          <span
            className="flex items-center gap-1 tabular-nums"
            title={t("tier.peakPowerHint")}
            data-testid="incursion-tier-power"
          >
            <EntityIcon src={powerIcon()} alt="" className="size-5" />
            {number.format(Math.round(estimate.peakPower))}
          </span>
        ) : null}
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
      {estimate ? (
        <p
          className={
            estimate.cleared
              ? "text-sm text-emerald-700 dark:text-emerald-400"
              : "text-sm text-amber-700 dark:text-amber-400"
          }
          title={t("estimate.hint")}
          data-testid="incursion-tier-estimate"
        >
          {estimate.cleared
            ? t("estimate.clears", { hp: estimate.hpLeftPct })
            : t("estimate.stops", {
                battle: estimate.wins + 1,
                total: estimate.battles,
              })}
        </p>
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

      <section className="space-y-3" aria-label={t("map.title")}>
        <h3 className="text-sm font-semibold">{t("map.title")}</h3>
        <ol className="space-y-3">
          {view.steps.map((step, at) => {
            const branched = (view.steps[at - 1]?.nodes.length ?? 0) > 1
            return (
              <li
                key={step.depth}
                className="space-y-2"
                data-testid={`incursion-step-${step.depth}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {t("map.step", { number: at + 1 })}
                  </span>
                  {step.choice ? (
                    <span data-testid="incursion-step-choice">
                      · {t("map.pickOne")}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {step.nodes.map((node) => (
                    <IncursionNodeCard
                      key={node.index}
                      node={node}
                      incursion={incursion}
                      battlesById={view.battlesById}
                      npcsById={npcsById}
                      progress={battleProgress(node)}
                      after={
                        branched && node.unlockedBy.length > 0
                          ? node.unlockedBy
                              .map((parent) => view.namesByIndex.get(parent))
                              .filter(Boolean)
                              .join(", ")
                          : undefined
                      }
                    />
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
