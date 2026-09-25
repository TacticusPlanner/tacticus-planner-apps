import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
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
import type { OnslaughtProgress } from "@/entities/player-data-override"
import type { ProjectGoalSummary } from "@/entities/project"
import {
  allocatePlanInventory,
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  computeGoalAcquisition,
  createCraftedInventoryPool,
  createUnitCoverage,
  estimateBonusRaids,
  estimateGoal,
  estimatePlanSchedule,
  estimateTodaySchedule,
  type EstimatePlanParams,
  type UnitCoverage,
  type EstimateResourceId,
  type EstimateUpgrade,
  type FarmingCharacter,
  type FarmingUpgrade,
  type GoalNeed,
  type RaidPlanSchedule,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

import type {
  DailyRaidGoalViewModel,
  DailyRaidsCalculationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceUrgency,
  DailyRaidResourceVisual,
} from "./daily-raids.domain"
import { dailyRaidResourceKey, shardResourceLabel } from "./daily-raids.domain"
import type { DailyRaidResourceLabels } from "./daily-raids.domain"

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
  labelResource?: DailyRaidResourceLabels
  dailyEnergy: number
  referenceDate?: Date
  onslaughtProgress?: OnslaughtProgress
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  shops?: readonly GameCatalogShop[]
}

export function activeProjectMembers(members: ProjectGoalSummary[]) {
  return members
    .filter((member) => member.goal.status === "Active")
    .sort((left, right) => left.priority - right.priority)
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
  const abilityCoverageByEntity = new Map<string, UnitCoverage>()
  const craftedInventory = createCraftedInventoryPool(
    params.inventoryUpgrades,
    params.upgradesById
  )
  // One reference date for every goal's shop-supply projection in this pass, mirroring
  // plan-insights-calc.ts, so two goals sharing a shop offer see the same weekday schedule.
  const referenceDate = params.referenceDate ?? new Date()

  // A canonical goal in several projects is one piece of work: count its demand once, however many
  // memberships list it (rank-milestone-planning: shared project membership is not duplicate work).
  const countedGoalIds = new Set<string>()
  for (const member of activeMembers) {
    const detail = detailById.get(member.goal.goalId)
    if (!detail || countedGoalIds.has(detail.goalId)) continue
    countedGoalIds.add(detail.goalId)

    const coverage =
      abilityCoverageByEntity.get(detail.entityId) ?? createUnitCoverage()
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
      coveredRankSlots: coverage.rankSlots,
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
    // Unlock/Ascension's selected acquisition sources (tacticus-planner-apps#103), resolved into
    // Onslaught/Shop flat suppliers and Campaign gating — same shared helper `plan-insights-calc.ts`
    // uses, so Today/Raids Plan derive the same demand Insights does for a shop/Onslaught-sourced
    // goal (spec: *Shared estimate consumers use the same derived demand*).
    const {
      acquisitionSources,
      campaignSource,
      campaignShardsEnabled,
      flatSuppliers,
    } = computeGoalAcquisition({
      detail,
      need,
      mowsById: params.mowsById,
      charactersById: params.charactersById,
      playerCharacterById: params.playerCharacterById,
      playerMowById: params.playerMowById,
      onslaughtProgress: params.onslaughtProgress,
      onslaughtRewards: params.onslaughtRewards,
      shops: params.shops,
      referenceDate,
    })
    if (need.shardId && (need.shards > 0 || flatSuppliers.length > 0)) {
      needs.push({ id: need.shardId, count: need.shards })
      const character = params.charactersById.get(detail.entityId)
      if (character) {
        const ownedShards =
          detail.goalType === "Unlock"
            ? (params.inventoryShardById.get(detail.entityId)?.amount ?? 0)
            : (params.playerCharacterById.get(detail.entityId)?.shards ?? 0)
        resourceLabels.set(
          need.shardId,
          params.labelResource?.shards?.(entityId, character.name) ??
            shardResourceLabel(character.name)
        )
        resourceVisuals.set(need.shardId, {
          kind: "shard",
          unitId: entityId,
        })
        shardCatalog.set(need.shardId, {
          id: need.shardId,
          farmLocations: campaignShardsEnabled ? character.shardLocations : [],
        })
        shardProgress.set(dailyRaidResourceKey(detail.goalId, need.shardId), {
          owned: ownedShards,
          target: ownedShards + need.shards,
        })
      }
    }
    if (needs.length === 0 && stages === null) continue
    for (const needEntry of need.upgrades) {
      const upgradeId = needEntry.id as UpgradeId
      const upgrade = params.upgradesById.get(upgradeId)
      const catalogLabel = upgrade?.label ?? needEntry.id
      resourceLabels.set(
        needEntry.id,
        params.labelResource?.upgrade?.(upgradeId, catalogLabel) ?? catalogLabel
      )
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
      farmingLocationIds: acquisitionSources
        ? campaignSource?.ids
        : (detail.config.farmingLocationIds ?? undefined),
      flatSuppliers: flatSuppliers.length > 0 ? flatSuppliers : undefined,
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
    resourceUrgencyByGoalAndResource: calculateResourceUrgency(
      goals,
      inventory,
      upgradesById,
      params.battlesById,
      params.dailyEnergy,
      params.referenceDate
    ),
    resourceProgressByDay: projectResourceProgress(plan.days, initialProgress),
    attemptsUsedByBattle: today.attemptsUsedByBattle,
  }
}

export function calculateResourceUrgency(
  goals: readonly GoalNeed[],
  inventory: readonly { id: EstimateResourceId; count: number }[],
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  dailyEnergy: number,
  referenceDate?: Date
): ReadonlyMap<string, DailyRaidResourceUrgency> {
  const result = new Map<string, DailyRaidResourceUrgency>()
  const allocations = allocatePlanInventory([...goals], [...inventory])

  for (const goal of goals) {
    const remainingByResource = new Map<EstimateResourceId, number>()
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      for (const need of stage.remaining) {
        remainingByResource.set(
          need.id,
          (remainingByResource.get(need.id) ?? 0) + need.count
        )
      }
    }

    for (const [resourceId, count] of remainingByResource) {
      const outcome = estimateGoal({
        needs: [{ id: resourceId, count }],
        upgradesById,
        battlesById,
        dailyEnergy,
        farmingLocationIds: goal.farmingLocationIds,
        flatSuppliers: goal.flatSuppliers,
        referenceDate,
      })
      if (outcome.status !== "Estimated") continue
      result.set(dailyRaidResourceKey(goal.goalId, resourceId), {
        days: outcome.days,
        energyTotal: outcome.energyTotal,
      })
    }
  }

  return result
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
