import type { MowStorageModel } from "@workspace/game-catalog"
import { rankIndex, type Rank, type UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import type { GoalKind } from "@/entities/goal"

import { estimateGoal } from "./estimate/estimate"
import type { EstimateResult } from "./estimate/estimate.domain"
import {
  computeMissingUpgrades,
  type MissingUpgradeEntry,
} from "./goal-spec-builder"
import { computeMowMissingUpgrades } from "./mow-ability-calc"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

/**
 * The combined-creation composer's Rank/Ability resource-requirement preview + isolated day-by-day
 * estimate (plan §9 context (a); plan §16 phase 6 for the MoW branch), dispatching to
 * `computeMissingUpgrades` (Character/Rank) or `computeMowMissingUpgrades` (MoW/Ability) and then
 * feeding the (already entity-agnostic) estimate engine — kept out of `use-create-goal-form.ts` for
 * that file's max-lines budget, and combined into one function (rather than two separate memos) so
 * the entity-type branch isn't duplicated across them.
 */
export function computeCreationPreview(params: {
  entityType: "Character" | "Mow"
  enabledTypes: ReadonlySet<GoalKind>
  character: Character | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  rankStart: Rank
  rankEnd: Rank
  rankEndPointFive: boolean
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  dailyEnergy?: number
}): {
  missingUpgrades: MissingUpgradeEntry[]
  estimatePreview: EstimateResult | null
} {
  const missingUpgrades =
    params.entityType === "Mow"
      ? computeMowMissingUpgrades({
          abilityEnabled: params.enabledTypes.has("Ability"),
          mow: params.mow,
          playerMow: params.playerMow,
          activeStart: params.abilityActiveStart,
          activeEnd: params.abilityActiveEnd,
          passiveStart: params.abilityPassiveStart,
          passiveEnd: params.abilityPassiveEnd,
          inventoryUpgrades: params.inventoryUpgrades,
          upgradesById: params.upgradesById,
        })
      : computeMissingUpgrades({
          rankEnabled: params.enabledTypes.has("Rank"),
          character: params.character,
          rankStart: params.rankStart,
          rankEnd: params.rankEnd,
          rankEndPointFive: params.rankEndPointFive,
          playerCharacter: params.playerCharacter,
          inventoryUpgrades: params.inventoryUpgrades,
          upgradesById: params.upgradesById,
        })

  const previewEnabled =
    params.entityType === "Mow"
      ? params.enabledTypes.has("Ability")
      : params.enabledTypes.has("Rank")
  const hasEntity =
    params.entityType === "Mow" ? !!params.mow : !!params.character
  const rankRangeValid =
    params.entityType !== "Character" ||
    rankIndex(params.rankStart) < rankIndex(params.rankEnd)

  const estimatePreview =
    previewEnabled && hasEntity && rankRangeValid
      ? estimateGoal({
          needs: missingUpgrades.map((entry) => ({
            id: entry.id,
            count: entry.missing,
          })),
          upgradesById: params.upgradesById,
          battlesById: params.battlesById,
          dailyEnergy: params.dailyEnergy ?? 288,
        })
      : null

  return { missingUpgrades, estimatePreview }
}
