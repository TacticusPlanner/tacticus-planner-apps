import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  ShopRewardOffer,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import { rankAt } from "@workspace/game-domain"
import type { BattleId, UnitId, UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { activeProjectMembers, globalPriorityOf } from "@/entities/goal"
import type { GoalDetail, GoalPlanEntry } from "@/entities/goal"
import type { OnslaughtProgress } from "@/entities/player-data-override"
import {
  allocatePlanInventory,
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  computeGoalAcquisition,
  createCraftedInventoryPool,
  createUnitCoverage,
  estimateBonusRaids,
  estimateRaidsLeftToday,
  estimateGoal,
  estimatePlanSchedule,
  estimateTodayRun,
} from "@/entities/goal-farming"
import type {
  EstimatePlanParams,
  UnitCoverage,
  EstimateResourceId,
  EstimateUpgrade,
  FarmingCharacter,
  FarmingUpgrade,
  GoalNeed,
  RaidPlanSchedule,
} from "@/entities/goal-farming"
import type { Battle } from "@/shared/lib"

import { blockedGoalsOf } from "./blocked-goals"
import {
  goalTargetLabel,
  projectResourceProgress,
  resourceMilestoneTargets,
  resourceProgress,
  totalResourceProgress,
} from "./daily-raids-progress"
import { planEventFarm } from "./home-screen-event-farm"
import type { EventFarmOrder } from "./home-screen-event-farm"
import { buildMissionGoalNodes } from "./mission-raids"
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
  DailyRaidResourceLabels,
} from "./daily-raids.domain"
import { dailyRaidResourceKey, shardResourceLabel } from "./daily-raids.domain"
import type { TodayQuickFilterOptions } from "./today-quick-filters/today-quick-filters"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

export type DailyRaidsCalculationInput = {
  members: GoalPlanEntry[]
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
  /** Today's quick filters (Fewer raids, Combine goals). Like the Raids Filters they change Today and
   *  Bonus Raids only. */
  quickFilters?: TodayQuickFilterOptions
  /** The battles "CE nodes first" prefers (the active campaign event's reached nodes), set only
   *  while that quick filter is on. Today and Bonus Raids only, like the quick filters. */
  preferredBattleIds?: ReadonlySet<BattleId>
  /** The player's real attempts left today per node (none synced: every node is fresh). Today,
   *  Bonus Raids and the Plan's day 1 cap each node at it, so a need whose nodes were raided out
   *  today moves to tomorrow instead of being planned again at an exhausted node. */
  attemptsLeftByBattle?: ReadonlyMap<BattleId, number>
  /** Real energy already spent today (synced attempts; 0 when none). Today and the Plan's day 1
   *  spend only what is left of `dailyEnergy`. */
  energyUsedToday?: number
  /** The Dailies > HSE farm list inputs: event points per eligible battle, real attempts left today
   *  and the energy left today. Without them no `eventFarm` is returned; Today, Bonus and the Plan
   *  never read them. */
  eventFarm?: {
    pointsByBattleId: ReadonlyMap<BattleId, number>
    attemptsLeftByBattle: ReadonlyMap<BattleId, number>
    energyBudget: number
    /** Points per energy (default) or energy per item first (`planEventFarm`). */
    order?: EventFarmOrder
  }
  /** The Dailies > HRE tab only: also return, per node, the best-priority goal it feeds. */
  missionGoalNodes?: boolean
  referenceDate?: Date
  onslaughtProgress?: OnslaughtProgress
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  onslaughtRunsPerDay?: number
  shops?: readonly GameCatalogShop[]
}

/** An Unlock goal for a character no campaign node drops shards for (Kharn, Ragnar): its shards come
 *  from shops, so the Schedule's completion date leaves it out rather than showing none at all. */
function isShopOnlyUnlock(
  detail: GoalDetail,
  character: Pick<CharacterStorageModel, "shardLocations"> | undefined
) {
  return (
    detail.goalType === "Unlock" &&
    detail.entityType !== "Mow" &&
    !!character &&
    character.shardLocations.length === 0
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
  const shopOffersById = new Map<string, ShopRewardOffer>()
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
      ascensionCoverage: coverage,
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
      mythicShardNeed,
      shardNeed,
    } = computeGoalAcquisition({
      detail,
      need,
      mowsById: params.mowsById,
      charactersById: params.charactersById,
      playerCharacterById: params.playerCharacterById,
      playerMowById: params.playerMowById,
      onslaughtProgress: params.onslaughtProgress,
      onslaughtRewards: params.onslaughtRewards,
      onslaughtRunsPerDay: params.onslaughtRunsPerDay,
      upgradesById: params.upgradesById,
      shops: params.shops,
      referenceDate,
    })
    for (const offer of shopOffers) shopOffersById.set(offer.offerId, offer)
    // A Machine of War's shards arrive here only when Onslaught or a shop supplies them.
    if (shardNeed) {
      needs.push(shardNeed)
      const character = params.charactersById.get(detail.entityId)
      if (need.shardId && character) {
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
    if (mythicShardNeed) needs.push(mythicShardNeed)
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
      excludeFromCompletion: isShopOnlyUnlock(
        detail,
        params.charactersById.get(detail.entityId)
      ),
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
      targetProgression:
        detail.goalType === "Ascension" && detail.config.progression
          ? detail.config.progression.end
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
    attemptsLeftByBattle: params.attemptsLeftByBattle,
    energyUsedToday: params.energyUsedToday,
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
    fewerRaids: params.quickFilters?.fewerRaids,
    preferredBattleIds: params.preferredBattleIds,
    combineGoals: params.quickFilters?.combineGoals,
  }
  const { today, filteredOut } = estimateTodayRun(filteredCalculation)
  const bonus = estimateBonusRaids(filteredCalculation)
  const raidsLeftToday = estimateRaidsLeftToday({
    ...filteredCalculation,
    attemptsLeftByBattle: params.attemptsLeftByBattle ?? new Map(),
  })
  const plan: RaidPlanSchedule = estimatePlanSchedule(calculation)
  const eventFarm = params.eventFarm
    ? planEventFarm({
        goals,
        inventory,
        upgradesById,
        battlesById: params.battlesById,
        nodeFilter,
        fewerRaids: params.quickFilters?.fewerRaids,
        combineGoals: params.quickFilters?.combineGoals,
        ...params.eventFarm,
      })
    : undefined
  const missionGoalNodes = params.missionGoalNodes
    ? buildMissionGoalNodes(goals, inventory, upgradesById, params.battlesById)
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
    raidsLeftToday,
    planDays: plan.days,
    planSummary: plan.summary,
    blockedGoals,
    filteredOut,
    eventFarm,
    missionGoalNodes,
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
    combineGoals: !!params.quickFilters?.combineGoals,
    resourceUrgencyByResource: params.quickFilters?.combineGoals
      ? calculateCombinedResourceUrgency(
          goals,
          inventory,
          upgradesById,
          params.battlesById,
          params.dailyEnergy,
          params.referenceDate
        )
      : new Map(),
    resourceTotals: totalResourceProgress(
      initialProgress,
      inventory,
      new Set(shardCatalog.keys())
    ),
    // Per-goal cards count toward the milestone the schedule is farming; `resourceTotals` above
    // stays over each goal's final target (Combine goals and the HSE list pool every stage).
    resourceProgressByDay: projectResourceProgress(
      plan.days,
      initialProgress,
      resourceMilestoneTargets(goals)
    ),
    attemptsUsedByBattle: today.attemptsUsedByBattle,
  }
}

/**
 * The schedule farms a goal's stages (milestones) in order, so a resource is as urgent as what the
 * first stage still needing it lacks, not its remaining need over every later stage.
 */
function firstStageRemaining(
  stages: readonly {
    remaining: readonly { id: EstimateResourceId; count: number }[]
  }[]
) {
  const result = new Map<EstimateResourceId, number>()
  for (const stage of stages) {
    const stageRemaining = new Map<EstimateResourceId, number>()
    for (const need of stage.remaining) {
      stageRemaining.set(
        need.id,
        (stageRemaining.get(need.id) ?? 0) + need.count
      )
    }
    for (const [resourceId, count] of stageRemaining) {
      if (!result.has(resourceId)) result.set(resourceId, count)
    }
  }
  return result
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
    const remainingByResource = firstStageRemaining(
      allocations.get(goal.goalId)?.stages ?? []
    )

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

/**
 * Combine goals: one urgency per resource over every goal, as if they were one goal. Each goal's
 * remaining need (after inventory, in priority order) is summed per resource and estimated at the
 * nodes of the highest-priority goal that needs it, the same nodes the pooled run farms it at. Today
 * orders its single combined list by it, most energy to clear first, like Insights' bottlenecks.
 */
export function calculateCombinedResourceUrgency(
  goals: readonly GoalNeed[],
  inventory: readonly { id: EstimateResourceId; count: number }[],
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  dailyEnergy: number,
  referenceDate?: Date
): ReadonlyMap<string, DailyRaidResourceUrgency> {
  const ordered = [...goals].sort((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(ordered, [...inventory])
  const pooled = new Map<
    EstimateResourceId,
    { count: number; owner: GoalNeed }
  >()
  for (const goal of ordered) {
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      for (const need of stage.remaining) {
        const current = pooled.get(need.id)
        if (current) current.count += need.count
        else pooled.set(need.id, { count: need.count, owner: goal })
      }
    }
  }

  const result = new Map<string, DailyRaidResourceUrgency>()
  for (const [resourceId, { count, owner }] of pooled) {
    const outcome = estimateGoal({
      needs: [{ id: resourceId, count }],
      upgradesById,
      battlesById,
      dailyEnergy,
      farmingLocationIds: owner.farmingLocationIds,
      flatSuppliers: owner.flatSuppliers,
      referenceDate,
    })
    if (outcome.status !== "Estimated") continue
    result.set(resourceId, {
      days: outcome.days,
      energyTotal: outcome.energyTotal,
    })
  }
  return result
}
