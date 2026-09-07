import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import { farmingStageTargets } from "./farming-stages"
import type { CraftedInventoryPool } from "./upgrade-recipe"
import {
  abilityResourceNeed,
  rankResourceNeed,
  rankSlotsRemaining,
} from "./goal-need"
import {
  ascensionResourceNeed,
  unlockResourceNeed,
  type ResourceNeed,
} from "./progression-cost-calc"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

export type GoalRequirementParams = {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  characterView: CharacterStorageModel | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  inventoryShard: InventoryShard | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  coveredAbilityTransitions?: { primary: Set<number>; secondary: Set<number> }
  craftedInventory?: CraftedInventoryPool
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
      craftedInventory: params.craftedInventory,
    })
    return upgrades
      ? {
          upgrades,
          shardId: null,
          shards: 0,
          mythicShards: 0,
          orbsByType: {},
          upgradeSlotsRemaining: rankSlotsRemaining({
            detail,
            character: params.character,
            playerCharacter: params.playerCharacter,
          }),
        }
      : null
  }
  if (detail.goalType === "Ability") {
    const upgrades = abilityResourceNeed({
      detail,
      mow: params.mow,
      playerMow: params.playerMow,
      upgradesById,
      coveredTransitions: params.coveredAbilityTransitions,
      craftedInventory: params.craftedInventory,
    })
    return upgrades
      ? {
          upgrades,
          shardId: null,
          shards: 0,
          mythicShards: 0,
          orbsByType: {},
          upgradeSlotsRemaining: null,
        }
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
    const targets = farmingStageTargets(
      "rank",
      start,
      target.end,
      detail.config.farmingStrategy
    )
    if (targets.length === 0) return null
    return targets
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
              endAppliedUpgrades:
                end === target.end ? target.endAppliedUpgrades : 0,
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
              craftedInventory: params.craftedInventory,
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
    // One shared coverage accumulator across every stage of *both* tracks — its `primary`/
    // `secondary` sets are keyed independently, so raising both tracks in one goal never
    // double-claims a shared base upgrade.
    const coverage = params.coveredAbilityTransitions ?? {
      primary: new Set<number>(),
      secondary: new Set<number>(),
    }

    // True once at least one track produced stage targets — distinguishes "nothing to raise"
    // (return null, like a Rank goal with an empty range) from "raised, but crafted inventory
    // covers every material" (return the empty-after-filter array, an applicable empty result).
    let anyStageTargets = false

    // Stages for one advancing track — the other track is pinned to its own start so this stage's
    // `abilityResourceNeed` yields only this track's materials.
    const trackStages = (
      track: "primary" | "secondary",
      trackStart: number,
      trackEnd: number
    ) => {
      if (trackEnd <= trackStart) return []
      const targets = farmingStageTargets(
        "ability",
        trackStart,
        trackEnd,
        detail.config.farmingStrategy
      )
      if (targets.length === 0) return []
      anyStageTargets = true
      let start = trackStart
      return targets
        .map((end) => {
          const stageAbility =
            track === "primary"
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
                craftedInventory: params.craftedInventory,
              }) ?? [],
          }
        })
        .filter((stage) => stage.needs.length > 0)
    }

    const stages = [
      ...trackStages("primary", ability.activeStart, ability.activeEnd),
      ...trackStages("secondary", ability.passiveStart, ability.passiveEnd),
    ]
    return anyStageTargets ? stages : null
  }
  return null
}
