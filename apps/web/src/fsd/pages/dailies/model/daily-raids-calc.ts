import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  rankAt,
  type BattleId,
  type UnitId,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"
import {
  allocatePlanInventory,
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  createCraftedInventoryPool,
  estimateBonusRaids,
  estimatePlanSchedule,
  estimateTodaySchedule,
  type EstimatePlanParams,
  type EstimateResourceId,
  type EstimateUpgrade,
  type FarmingCharacter,
  type FarmingUpgrade,
  type GoalNeed,
  type RaidPlanSchedule,
} from "@/features/goal-farming"
import type { Battle } from "@/shared/lib"

import type {
  DailyRaidGoalViewModel,
  DailyRaidsCalculationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "./daily-raids.domain"
import { dailyRaidResourceKey } from "./daily-raids.domain"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

export type DailyRaidsCalculationInput = {
  members: ProjectGoalSummary[]
  details: GoalDetail[]
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>
  playerMowById: ReadonlyMap<string, PlayerMow | undefined>
  inventoryShardById: ReadonlyMap<string, InventoryShard | undefined>
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  getCharacter: (unitId: UnitId) => FarmingCharacter | undefined
  getUnitLabel?: (detail: GoalDetail) => string
  getTargetLabel?: (detail: GoalDetail) => string
  dailyEnergy: number
  referenceDate?: Date
}

export function activeProjectMembers(members: ProjectGoalSummary[]) {
  return members
    .filter((member) => member.goal.status === "Active")
    .sort((left, right) => left.priority - right.priority)
}

export function availableCampaignBattles<
  TBattle extends { campaignGroupId: string },
>(
  battles: TBattle[],
  eventCampaignIds: ReadonlySet<string>,
  activeCampaignEventId: string | null | undefined
) {
  return battles.filter(
    (battle) =>
      !eventCampaignIds.has(battle.campaignGroupId) ||
      battle.campaignGroupId === activeCampaignEventId
  )
}

export function calculateDailyRaids(
  params: DailyRaidsCalculationInput
): DailyRaidsCalculationViewModel | null {
  const activeMembers = activeProjectMembers(params.members)
  const detailById = new Map(
    params.details.map((detail) => [detail.goalId, detail])
  )
  const goals: GoalNeed[] = []
  const goalsById = new Map<string, DailyRaidGoalViewModel>()
  const resourceLabels = new Map<string, string>()
  const resourceVisuals = new Map<string, DailyRaidResourceVisual>()
  const shardProgress = new Map<string, DailyRaidResourceProgress>()
  const shardCatalog = new Map<EstimateResourceId, EstimateUpgrade>()
  const abilityCoverageByEntity = new Map<
    string,
    { primary: Set<number>; secondary: Set<number> }
  >()
  const craftedInventory = createCraftedInventoryPool(
    params.inventoryUpgrades,
    params.upgradesById
  )

  for (const member of activeMembers) {
    const detail = detailById.get(member.goal.goalId)
    if (!detail) continue

    const coverage = abilityCoverageByEntity.get(detail.entityId) ?? {
      primary: new Set<number>(),
      secondary: new Set<number>(),
    }
    abilityCoverageByEntity.set(detail.entityId, coverage)
    const entityId = detail.entityId as UnitId
    const requirementParams = {
      detail,
      character: params.getCharacter(entityId),
      characterView: params.charactersById.get(detail.entityId),
      mow: params.mowsById.get(detail.entityId),
      playerCharacter: params.playerCharacterById.get(detail.entityId),
      playerMow: params.playerMowById.get(detail.entityId),
      inventoryShard: params.inventoryShardById.get(detail.entityId),
      upgradesById: params.upgradesById,
      ascensionCostsById: params.ascensionCostsById,
      unlockShardCostsById: params.unlockShardCostsById,
      coveredAbilityTransitions: coverage,
      craftedInventory,
    }
    const stages = calculateGoalFarmingStages(requirementParams)
    const need =
      stages !== null
        ? {
            upgrades: stages.flatMap((stage) => stage.needs),
            shardId: null,
            shards: 0,
            mythicShards: 0,
            orbsByType: {},
          }
        : calculateGoalResourceNeed(requirementParams)
    if (!need) continue

    const needs = [...need.upgrades]
    const campaignShardsEnabled =
      detail.goalType !== "Ascension" ||
      detail.config.ascensionFarming?.source !== "Onslaught"
    if (need.shardId && need.shards > 0 && campaignShardsEnabled) {
      needs.push({ id: need.shardId, count: need.shards })
      const character = params.charactersById.get(detail.entityId)
      if (character) {
        const ownedShards =
          detail.goalType === "Unlock"
            ? (params.inventoryShardById.get(detail.entityId)?.amount ?? 0)
            : (params.playerCharacterById.get(detail.entityId)?.shards ?? 0)
        resourceLabels.set(need.shardId, `${character.name} shards`)
        resourceVisuals.set(need.shardId, {
          kind: "shard",
          unitId: entityId,
        })
        shardCatalog.set(need.shardId, {
          id: need.shardId,
          farmLocations: character.shardLocations,
        })
        shardProgress.set(dailyRaidResourceKey(detail.goalId, need.shardId), {
          owned: ownedShards,
          target: ownedShards + need.shards,
        })
      }
    }
    if (needs.length === 0 && stages === null) continue
    for (const needEntry of need.upgrades) {
      const upgrade = params.upgradesById.get(needEntry.id as UpgradeId)
      resourceLabels.set(needEntry.id, upgrade?.label ?? needEntry.id)
      if (upgrade) {
        resourceVisuals.set(needEntry.id, {
          kind: "upgrade",
          id: upgrade.id,
          rarity: upgrade.rarity,
          crafted: upgrade.crafted,
        })
      }
    }

    goals.push({
      goalId: detail.goalId,
      priority: member.priority,
      needs,
      stages: stages ?? undefined,
      farmingLocationIds: detail.config.farmingLocationIds ?? undefined,
    })
    goalsById.set(detail.goalId, {
      goalId: detail.goalId,
      priority: member.priority,
      unitId: entityId,
      unitType: detail.entityType === "Mow" ? "Mow" : "Character",
      unitLabel:
        params.getUnitLabel?.(detail) ??
        params.charactersById.get(detail.entityId)?.name ??
        params.mowsById.get(detail.entityId)?.name ??
        detail.entityId,
      targetLabel: params.getTargetLabel?.(detail) ?? goalTargetLabel(detail),
      goalKind: detail.goalType,
      targetRank:
        detail.goalType === "Rank" && detail.config.rank
          ? rankAt(detail.config.rank.end)
          : undefined,
    })
  }

  if (goals.length === 0) return null

  const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
    ...params.upgradesById,
    ...shardCatalog,
  ])
  const inventory = params.inventoryUpgrades.map((entry) => ({
    id: entry.upgradeId as EstimateResourceId,
    count: entry.amount,
  }))
  const initialProgress = resourceProgress(goals, inventory, shardProgress)
  const calculation: EstimatePlanParams = {
    goals,
    upgradesById,
    battlesById: params.battlesById,
    dailyEnergy: params.dailyEnergy,
    inventory,
    referenceDate: params.referenceDate,
  }
  const today = estimateTodaySchedule(calculation)
  const bonus = estimateBonusRaids(calculation)
  const plan: RaidPlanSchedule = estimatePlanSchedule(calculation)
  if (today.entries.length === 0 && bonus.entries.length === 0) return null

  return {
    status: "ready",
    today,
    bonus,
    planDays: plan.days,
    planSummary: plan.summary,
    dailyEnergy: params.dailyEnergy,
    goalsById,
    resourceLabels,
    resourceVisuals,
    resourceProgressByDay: projectResourceProgress(plan.days, initialProgress),
    attemptsUsedByBattle: today.attemptsUsedByBattle,
  }
}

function resourceProgress(
  goals: GoalNeed[],
  inventory: { id: EstimateResourceId; count: number }[],
  shardProgress: ReadonlyMap<string, DailyRaidResourceProgress>
) {
  const progress = new Map(shardProgress)
  const allocations = allocatePlanInventory(goals, inventory)

  for (const goal of goals) {
    const totals = new Map<EstimateResourceId, DailyRaidResourceProgress>()
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      const remaining = new Map(
        stage.remaining.map((entry) => [entry.id, entry.count])
      )
      for (const need of stage.needs) {
        const current = totals.get(need.id) ?? { owned: 0, target: 0 }
        current.target += need.count
        current.owned += need.count - (remaining.get(need.id) ?? 0)
        totals.set(need.id, current)
      }
    }
    for (const [resourceId, value] of totals) {
      const key = dailyRaidResourceKey(goal.goalId, resourceId)
      if (!progress.has(key)) progress.set(key, value)
    }
  }

  return progress
}

function projectResourceProgress(
  days: DailyRaidsCalculationViewModel["today"][],
  initial: ReadonlyMap<string, DailyRaidResourceProgress>
) {
  const gained = new Map<string, number>()
  const result = new Map<
    number,
    ReadonlyMap<string, DailyRaidResourceProgress>
  >()

  for (const day of days) {
    result.set(
      day.day,
      new Map(
        [...initial].map(([key, progress]) => [
          key,
          {
            owned: Math.min(
              progress.target,
              Math.floor(progress.owned + (gained.get(key) ?? 0) + 1e-9)
            ),
            target: progress.target,
          },
        ])
      )
    )
    for (const entry of day.entries) {
      const key = dailyRaidResourceKey(entry.goalId, entry.resourceId)
      gained.set(key, (gained.get(key) ?? 0) + entry.itemsFarmed)
    }
  }

  return result
}

function goalTargetLabel(detail: GoalDetail): string {
  if (detail.goalType === "Rank" && detail.config.rank) {
    return `Rank ${rankAt(detail.config.rank.end)}`
  }
  if (detail.goalType === "Ability" && detail.config.ability) {
    const target = detail.config.ability
    return `Ability ${Math.max(target.activeEnd, target.passiveEnd)}`
  }
  if (detail.goalType === "Ascension" && detail.config.progression) {
    return `Ascension ${detail.config.progression.end}`
  }
  if (detail.goalType === "Unlock") return "Unlock"
  if (detail.goalType === "Upgrade" && detail.config.upgrade) {
    return `Upgrade ${detail.config.upgrade.targets.reduce((sum, item) => sum + item.quantity, 0)}`
  }
  return detail.goalType
}
