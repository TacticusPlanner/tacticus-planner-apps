import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import type { CharacterStorageModel } from "@workspace/game-catalog"
import type { BattleId, UpgradeId } from "@workspace/game-domain"

import {
  resourceLabel,
  selectFarmNodes,
  unavailableReason,
  type Battle,
  type FarmingUpgrade,
  type ResourceNeed,
} from "@/features/goal-farming"

/**
 * Goal detail's concise "what to farm and where" breakdown (surface-goal-farming-guidance) — the
 * remaining materials from the same `ResourceNeed` planning already computed, each resolved against
 * the same eligible-node predicate `estimatePlan` itself uses (`selectFarmNodes`), with the reason
 * stated (not silently omitted) when nothing is currently usable. Concise: only the first few
 * materials, since this is guidance, not a second Raids page. A Rank goal fully covered by an
 * earlier goal in the global order shows no breakdown at all — the caller checks
 * `remaining.coveredByEarlierGoal` before rendering this.
 */
export function GoalFarmingGuidance({
  remaining,
  farmingLocationIds,
  dailyEnergy,
  upgradesById,
  battlesById,
  charactersById,
}: {
  remaining: ResourceNeed
  farmingLocationIds: readonly string[] | null | undefined
  dailyEnergy: number
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
}) {
  const { t } = useTranslation()
  const materials = remaining.upgrades.slice(0, 5)
  if (materials.length === 0) return null

  return (
    <section className="grid gap-2" data-testid="goal-detail-farming-guidance">
      <h3 className="font-semibold">
        {t("goals.detail.farmingGuidanceTitle")}
      </h3>
      <ul className="grid gap-1">
        {materials.map((need) => {
          const label = resourceLabel(need.id, upgradesById, charactersById)
          const eligible = selectFarmNodes(
            need,
            upgradesById,
            battlesById,
            farmingLocationIds
          )
          const reason = unavailableReason(
            need,
            upgradesById,
            battlesById,
            farmingLocationIds,
            dailyEnergy
          )
          return (
            <li data-testid="goal-detail-farming-guidance-row" key={need.id}>
              <span className="font-medium">{label}</span>{" "}
              <span className="text-muted-foreground">
                {t("goals.overview.remaining.upgrades", { count: need.count })}
              </span>
              {" — "}
              {eligible.length > 0 ? (
                <span>
                  {t("goals.detail.farmingGuidanceEligible", {
                    count: eligible.length,
                  })}
                </span>
              ) : (
                <span className="text-amber-800 dark:text-amber-400">
                  {t(`goals.estimate.blocked.${reason ?? "NoFarmLocation"}`)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <Link
        className="text-sm underline"
        data-testid="goal-detail-farming-guidance-link"
        to="/dailies/raids/plan"
      >
        {t("goals.detail.farmingGuidanceLink")}
      </Link>
    </section>
  )
}
