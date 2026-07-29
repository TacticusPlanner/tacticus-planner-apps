import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"

import { farmingStageTargets } from "../farming/farming-stages"
import {
  abilityResourceNeed,
  rankResourceNeed,
} from "../insights/plan-insights-need"
import {
  ascensionResourceNeed,
  unlockResourceNeed,
  type ResourceNeed,
} from ".//progression-cost-calc"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

export type GoalRequirementParams = {
  detail: GoalDetail
  character: Character | undefined
  characterView: CharacterStorageModel | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  inventoryShard: InventoryShard | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  coveredAbilityTransitions?: { primary: Set<number>; secondary: Set<number> }
}

export function calculateGoalResourceNeed(
  params: GoalRequirementParams
): ResourceNeed | null {
  const { detail, upgradesById } = params
  const isMow = detail.entityType === "Mow"
  if (detail.goalType === "Rank") {
    const upgrades = rankResourceNeed({
      detail,
      character: params.character,
      playerCharacter: params.playerCharacter,
      upgradesById,
    })
    return upgrades
      ? { upgrades, shardId: null, shards: 0, mythicShards: 0, orbsByType: {} }
      : null
  }
  if (detail.goalType === "Ability") {
    const upgrades = abilityResourceNeed({
      detail,
      mow: params.mow,
      playerMow: params.playerMow,
      upgradesById,
      coveredTransitions: params.coveredAbilityTransitions,
    })
    return upgrades
      ? { upgrades, shardId: null, shards: 0, mythicShards: 0, orbsByType: {} }
      : null
  }
  if (detail.goalType === "Ascension" && detail.config.progression) {
    const owned = isMow ? params.playerMow : params.playerCharacter
    return ascensionResourceNeed({
      start: detail.config.progression.start,
      end: detail.config.progression.end,
      entityId: detail.entityId,
      isMow,
      ownedShards: owned?.shards ?? 0,
      ownedMythicShards: owned?.mythicShards ?? 0,
      currentProgression: owned?.progressionIndex,
      ascensionCostsById: params.ascensionCostsById,
    })
  }
  if (detail.goalType === "Unlock") {
    return unlockResourceNeed({
      initialRarity: params.characterView?.initialRarity,
      entityId: detail.entityId,
      isMow,
      ownedShards: params.inventoryShard?.amount ?? 0,
      unlockShardCostsById: params.unlockShardCostsById,
    })
  }
  return null
}

export function calculateGoalFarmingStages(params: GoalRequirementParams) {
  const detail = params.detail
  if (detail.goalType === "Rank" && detail.config.rank) {
    const target = detail.config.rank
    let start = target.start
    return farmingStageTargets(
      "rank",
      start,
      target.end,
      detail.config.farmingStrategy
    )
      .map((end) => {
        const stageDetail = {
          ...detail,
          config: {
            ...detail.config,
            rank: {
              ...target,
              start,
              end,
              endPointFive: end === target.end && target.endPointFive,
            },
          },
        }
        start = end
        return {
          target: String(end),
          needs:
            rankResourceNeed({
              detail: stageDetail,
              character: params.character,
              playerCharacter: params.playerCharacter,
              upgradesById: params.upgradesById,
            }) ?? [],
        }
      })
      .filter((stage) => stage.needs.length > 0)
  }
  if (
    detail.goalType === "Ability" &&
    detail.entityType === "Mow" &&
    detail.config.ability
  ) {
    const ability = detail.config.ability
    const primary = ability.activeEnd > ability.activeStart
    let start = primary ? ability.activeStart : ability.passiveStart
    const endTarget = primary ? ability.activeEnd : ability.passiveEnd
    const coverage = params.coveredAbilityTransitions ?? {
      primary: new Set<number>(),
      secondary: new Set<number>(),
    }
    return farmingStageTargets(
      "ability",
      start,
      endTarget,
      detail.config.farmingStrategy
    )
      .map((end) => {
        const stageAbility = primary
          ? {
              activeStart: start,
              activeEnd: end,
              passiveStart: ability.passiveStart,
              passiveEnd: ability.passiveStart,
            }
          : {
              activeStart: ability.activeStart,
              activeEnd: ability.activeStart,
              passiveStart: start,
              passiveEnd: end,
            }
        const stageDetail = {
          ...detail,
          config: { ...detail.config, ability: stageAbility },
        }
        start = end
        return {
          target: String(end),
          needs:
            abilityResourceNeed({
              detail: stageDetail,
              mow: params.mow,
              playerMow: params.playerMow,
              upgradesById: params.upgradesById,
              coveredTransitions: coverage,
            }) ?? [],
        }
      })
      .filter((stage) => stage.needs.length > 0)
  }
  return null
}
