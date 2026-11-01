import { useId, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { NpcStorageModel } from "@workspace/game-catalog"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { TierRunEstimate } from "../../model/incursion-plan.model"
import {
  tierChestRewards,
  tierCleared,
  tierUnclaimedRewards,
  type TierStars,
} from "../../model/incursion-progress.model"
import {
  runSteps,
  shardYield,
  tierSummary,
  type Incursion,
  type IncursionNode,
} from "../../model/incursions.model"
import { IncursionNodeCard } from "./incursion-node-card"
import { IncursionRewards } from "./incursion-rewards"
import { useTierName } from "./use-tier-name"

/** The player's stars on this MoW's battles and how to change one; absent while signed out. */
export type TierProgress = {
  stars: TierStars
  onStarsChange: (tierIndex: number, battleId: string, stars: number) => void
}

/**
 * The tier picker, the chosen tier's totals and its run map, step by step. With progress, a cleared
 * tier shows what a replay pays (its chests; star rewards are paid once) and an open tier shows the
 * one-time shards it still holds.
 */
export function IncursionTierView({
  incursion,
  tierIndex,
  onTierChange,
  npcsById,
  progress,
  estimates,
}: {
  incursion: Incursion
  tierIndex: number
  onTierChange: (index: number) => void
  npcsById: ReadonlyMap<string, NpcStorageModel>
  progress?: TierProgress
  /** The suggested team's estimated run per tier index. */
  estimates?: ReadonlyMap<number, TierRunEstimate>
}) {
  const { t } = useTranslation("incursions")
  const id = useId()
  const tierName = useTierName(incursion)
  const tier =
    incursion.tiers.find((candidate) => candidate.index === tierIndex) ??
    incursion.tiers[0]
  const view = useMemo(
    () =>
      tier
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
    [incursion.mowId, tier]
  )
  if (!tier || !view) return null

  const { summary } = view
  const estimate = estimates?.get(tier.index)
  const battleProgress = (node: IncursionNode) => {
    const battleId = node.kind === "battle" ? node.battleId : undefined
    if (!progress || !battleId) return undefined
    return {
      stars: progress.stars(tier.index, battleId),
      onChange: (stars: number) =>
        progress.onStarsChange(tier.index, battleId, stars),
    }
  }
  const cleared = progress ? tierCleared(tier, progress.stars) : false
  const oneTimeLeft = progress
    ? shardYield(incursion.mowId, tierUnclaimedRewards(tier, progress.stars))
    : undefined

  return (
    <div className="space-y-4" data-testid="incursion-tier">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor={id} className="text-xs text-muted-foreground">
            {t("card.tier")}
          </Label>
          <Select
            value={String(tier.index)}
            onValueChange={(value) => onTierChange(Number(value))}
          >
            <SelectTrigger
              id={id}
              className="w-44"
              data-testid="incursion-tier-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {incursion.tiers.map((candidate) => (
                <SelectItem
                  key={candidate.index}
                  value={String(candidate.index)}
                >
                  {tierName(candidate.index)}
                  {estimates?.get(candidate.index)?.cleared ? " ✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>
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
        <h4 className="text-sm font-semibold">{t("map.title")}</h4>
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
