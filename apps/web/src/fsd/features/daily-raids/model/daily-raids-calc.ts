import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  ShopShardOffer,
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
  estimateTodayRun,
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

import { blockedGoalsOf } from "./blocked-goals"
import {
  goalTargetLabel,
  projectResourceProgress,
  resourceProgress,
  totalResourceProgress,
} from "./daily-raids-progress"
import { planEventFarm } from "./home-screen-event-farm"
import { buildFarmNodeFilter } from "./raids-filters/build-farm-node-filter"
import type {
  RaidsFilterBattle,
  RaidsFilters,
} from "./raids-filters/raids-filters.domain"
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
  /** The applied Raids Filters and the catalog battles they are matched against. They constrain
   *  Today and Bonus Raids only; the Plan, blockers and urgency are always computed unfiltered. */
  raidsFilters?: RaidsFilters
  filterBattlesById?: ReadonlyMap<string, RaidsFilterBattle>
  /** The Dailies > HSE farm list inputs: event points per eligible battle, real attempts left today
   *  and the energy left today. Without them no `eventFarm` is returned; Today, Bonus and the Plan
   *  never read them. */
  eventFarm?: {
    pointsByBattleId: ReadonlyMap<BattleId, number>
    attemptsLeftByBattle: ReadonlyMap<BattleId, number>
    energyBudget: number
  }
  referenceDate?: Date
  onslaughtProgress?: OnslaughtProgress
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  shops?: readonly GameCatalogShop[]
}

/** The goal's position in the account-wide order; the weight every planning calculation sorts by. */
function globalPriorityOf(member: ProjectGoalSummary) {
  return member.goal.globalPriority ?? Number.MAX_SAFE_INTEGER
}

/** Active goals of `members` in global order (Paused goals keep their position but do not plan). */
export function activeProjectMembers(members: ProjectGoalSummary[]) {
  return members
    .filter((member) => member.goal.status === "Active")
    .sort((left, right) => globalPriorityOf(left) - globalPriorityOf(right))
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
  const shopOffersById = new Map<string, ShopShardOffer>()
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
      shopOffers,
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
    for (const offer of shopOffers) shopOffersById.set(offer.offerId, offer)
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
      priority: globalPriorityOf(member),
      needs,
      stages: stages ?? undefined,
      farmingLocationIds: acquisitionSources
        ? campaignSource?.ids
        : (detail.config.farmingLocationIds ?? undefined),
      flatSuppliers: flatSuppliers.length > 0 ? flatSuppliers : undefined,
    })
    goalsById.set(detail.goalId, {
      goalId: detail.goalId,
      priority: globalPriorityOf(member),
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
  const nodeFilter =
    params.raidsFilters && params.filterBattlesById
      ? buildFarmNodeFilter(
          params.raidsFilters,
          params.filterBattlesById,
          params.upgradesById
        )
      : undefined
  const filteredCalculation: EstimatePlanParams = {
    ...calculation,
    nodeFilter,
  }
  const { today, filteredOut } = estimateTodayRun(filteredCalculation)
  const bonus = estimateBonusRaids(filteredCalculation)
  const plan: RaidPlanSchedule = estimatePlanSchedule(calculation)
  const eventFarm = params.eventFarm
    ? planEventFarm({
        goals,
        inventory,
        upgradesById,
        battlesById: params.battlesById,
        nodeFilter,
        ...params.eventFarm,
      })
    : undefined
  const blockedGoals = blockedGoalsOf(goals, plan.outcomes)
  // Nothing to raid and nothing to explain: no plan. A goal blocked outright still gets a plan view
  // so its blockers are reported rather than silently dropped, and so does a filter that removed
  // every node (the filtered-out notice is the only way back to an unfiltered Today).
  if (
    today.entries.length === 0 &&
    bonus.entries.length === 0 &&
    blockedGoals.length === 0 &&
    filteredOut.length === 0
  ) {
    return null
  }

  return {
    status: "ready",
    today,
    bonus,
    planDays: plan.days,
    planSummary: plan.summary,
    blockedGoals,
    filteredOut,
    eventFarm,
    dailyEnergy: params.dailyEnergy,
    goalsById,
    shopOffersById,
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
    resourceTotals: totalResourceProgress(
      initialProgress,
      inventory,
      new Set(shardCatalog.keys())
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
