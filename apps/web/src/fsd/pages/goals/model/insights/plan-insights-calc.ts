import type {
  AscensionCostStorageModel,
  CampaignDescriptor,
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type {
  CampaignId,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import type { GoalDetail } from "@/entities/goal"
import type { OnslaughtProgress } from "@/entities/player-data-override"
import { computeCampaignInsights } from "@/features/campaign-insights"

import {
  allocatePlanInventory,
  createCraftedInventoryPool,
  estimatePlan,
  selectFarmNodes,
} from "@/features/goal-farming"
import {
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalNeed,
  type UpgradeNeed,
} from "@/features/goal-farming"
import { resourceLabel } from "@/features/goal-farming"
import {
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  computeGoalAcquisition,
  isMowDetail,
} from "@/features/goal-farming"
import { computeGoalProgress } from "../attainment/goal-progress"
import { computePotentialProgressRatio } from "./potential-progress"
import {
  allocateOrbInventory,
  createOrbGoalNeed,
  type InventoryOrbs,
  type OrbGoalNeed,
} from "./orb-potential-allocation"
import type {
  PlanInsightsBottleneck,
  PlanInsightsResult,
  PlanInsightsTotals,
} from ".//use-plan-insights.domain"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

/** The Insights view's full per-project aggregation (plan §16 phase 7) — pure, given every batch-
 *  fetched input `use-plan-insights.ts`'s hook gathers. See that file's doc comment for the overall
 *  shape/scope; split out here purely for this repo's max-lines rule. */
export function computePlanInsights(params: {
  details: GoalDetail[]
  priorityByGoalId: ReadonlyMap<string, number>
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>
  playerMowById: ReadonlyMap<string, PlayerMow | undefined>
  inventoryShardById: ReadonlyMap<string, InventoryShard | undefined>
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  inventoryOrbs?: InventoryOrbs
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  battlesById: Parameters<typeof estimatePlan>[0]["battlesById"]
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  releaseTypeByGroupId: ReadonlyMap<CampaignId, string>
  getCharacter: (unitId: UnitId) => Character | undefined
  campaignName: (descriptor: Pick<CampaignDescriptor, "nameKey">) => string
  campaignFullLabel: (descriptor: CampaignDescriptor) => string
  dailyEnergy?: number
  onslaughtProgress?: OnslaughtProgress
  currentOnslaughtTokens?: number
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  /** The daily-shop dataset, used to resolve a goal's selected `Shop` acquisition-source ids back
   *  into offers with their per-day supply (tacticus-planner-apps#103). Omitting it treats every
   *  goal as if it selected no shop sources — the shared estimate still runs, just without that
   *  contribution. */
  shops?: readonly GameCatalogShop[]
}): PlanInsightsResult {
  const totals: PlanInsightsTotals = {
    upgradesByRarity: {},
    orbsByType: {},
    shards: 0,
    mythicShards: 0,
  }

  const goalNeeds: GoalNeed[] = []
  const orbGoalNeeds: OrbGoalNeed[] = []
  const provenance = new Map<EstimateResourceId, Set<string>>()
  const shardCatalogEntries = new Map<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >()
  const campaignNeeds: { id: EstimateResourceId; count: number }[] = []
  const abilityCoverageByEntity = new Map<
    string,
    { primary: Set<number>; secondary: Set<number> }
  >()
  let onslaughtTokens = 0
  // One reference date for every goal's shop-supply projection in this pass, so two goals sharing a
  // shop offer see the same weekday-probability schedule.
  const referenceDate = new Date()
  const craftedInventory = createCraftedInventoryPool(
    params.inventoryUpgrades,
    params.upgradesById
  )

  const addProvenance = (id: EstimateResourceId, goalId: string) => {
    const set = provenance.get(id) ?? new Set<string>()
    set.add(goalId)
    provenance.set(id, set)
  }

  const orderedDetails = [...params.details].sort(
    (left, right) =>
      (params.priorityByGoalId.get(left.goalId) ?? Number.MAX_SAFE_INTEGER) -
      (params.priorityByGoalId.get(right.goalId) ?? Number.MAX_SAFE_INTEGER)
  )
  for (const detail of orderedDetails) {
    const entityId = detail.entityId as UnitId
    const coverage = abilityCoverageByEntity.get(detail.entityId) ?? {
      primary: new Set<number>(),
      secondary: new Set<number>(),
    }
    abilityCoverageByEntity.set(detail.entityId, coverage)
    const needParams = {
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
    const stages = calculateGoalFarmingStages(needParams)
    const need =
      stages !== null
        ? {
            upgrades: stages.flatMap((stage) => stage.needs),
            shardId: null,
            shards: 0,
            mythicShards: 0,
            orbsByType: {},
          }
        : calculateGoalResourceNeed(needParams)
    if (!need) continue

    const {
      acquisitionSources,
      campaignSource,
      campaignShardsEnabled,
      flatSuppliers,
      onslaughtTokensDelta,
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
    onslaughtTokens += onslaughtTokensDelta

    totals.shards += need.shards
    totals.mythicShards += need.mythicShards
    for (const [rarity, count] of Object.entries(need.orbsByType)) {
      totals.orbsByType[rarity as Rarity] =
        (totals.orbsByType[rarity as Rarity] ?? 0) + (count ?? 0)
    }

    const needs: UpgradeNeed[] = []
    for (const material of need.upgrades) {
      // `need.upgrades` only ever holds true upgrade ids (progression-cost-calc.ts's Ascension/
      // Unlock/Shards needs never populate it; only Rank/Ability do) — `EstimateResourceId`'s wider
      // union is a typing artifact of sharing `UpgradeNeed` with the shard-aware engine.
      const rarity = params.upgradesById.get(material.id as UpgradeId)?.rarity
      if (rarity) {
        totals.upgradesByRarity[rarity] =
          (totals.upgradesByRarity[rarity] ?? 0) + material.count
      }
      addProvenance(material.id, detail.goalId)
      campaignNeeds.push({ id: material.id, count: material.count })
      needs.push(material)
    }

    if (need.shardId && (need.shards > 0 || flatSuppliers.length > 0)) {
      needs.push({ id: need.shardId, count: need.shards })
      addProvenance(need.shardId, detail.goalId)
      campaignNeeds.push({ id: need.shardId, count: need.shards })

      const characterView = params.charactersById.get(detail.entityId)
      if (characterView && !shardCatalogEntries.has(need.shardId)) {
        // `rarity` here is only for computeCampaignInsights's value-weighting formula (it has no
        // farmable-resource concept of its own rarity) — the character's own starting rarity is the
        // natural stand-in, mirroring how a higher-rarity character's shards are scarcer/more
        // valuable in-game. The estimate engine below never reads this field. `farmLocations` is
        // empty when the Campaigns group is unselected (spec: excludes campaign farming entirely),
        // leaving the shop/Onslaught flat suppliers above as the need's only coverage.
        shardCatalogEntries.set(need.shardId, {
          id: need.shardId,
          rarity: characterView.initialRarity,
          farmLocations: campaignShardsEnabled
            ? characterView.shardLocations
            : [],
        })
      }
    }

    const priority = params.priorityByGoalId.get(detail.goalId)
    if (detail.goalType === "Ascension") {
      const entity = isMowDetail(detail)
        ? params.mowsById.get(detail.entityId)
        : params.charactersById.get(detail.entityId)
      const orbGoal = createOrbGoalNeed({
        goalId: detail.goalId,
        priority,
        alliance: entity?.alliance,
        orbsByType: need.orbsByType,
      })
      if (orbGoal) orbGoalNeeds.push(orbGoal)
    }
    if ((needs.length > 0 || stages !== null) && priority !== undefined) {
      goalNeeds.push({
        goalId: detail.goalId,
        priority,
        needs,
        stages: stages ?? undefined,
        // Rank/Ability restrict their upgrade-node farming via `config.farmingLocationIds`; Unlock/
        // Ascension restrict shard-node farming via their selected `Campaign` acquisition source's
        // ids instead (see `campaignSource` above) — without threading it through, `estimatePlan`
        // falls back to auto-picking every one of the character's shard locations regardless of
        // what the user actually selected, so a duration estimate never reflects the selection.
        farmingLocationIds: acquisitionSources
          ? campaignSource?.ids
          : (detail.config.farmingLocationIds ?? undefined),
        flatSuppliers: flatSuppliers.length > 0 ? flatSuppliers : undefined,
      })
    }
  }

  const combinedUpgradesById = new Map<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >([...params.upgradesById, ...shardCatalogEntries])

  const inventory: UpgradeNeed[] = params.inventoryUpgrades.map((entry) => ({
    id: entry.upgradeId as EstimateResourceId,
    count: entry.amount,
  }))

  const estimateResults = estimatePlan({
    goals: goalNeeds,
    upgradesById: combinedUpgradesById,
    battlesById: params.battlesById,
    dailyEnergy: params.dailyEnergy ?? 288,
    inventory,
  })
  const allocations = allocatePlanInventory(goalNeeds, inventory)
  const orbAllocations = allocateOrbInventory(
    orbGoalNeeds,
    params.inventoryOrbs
  )
  const potentialProgressByGoalId = new Map<string, number>()
  for (const detail of orderedDetails) {
    const allocation =
      detail.goalType === "Ascension"
        ? orbAllocations.get(detail.goalId)
        : detail.goalType === "Rank" || detail.goalType === "Ability"
          ? allocations.get(detail.goalId)
          : undefined
    if (!allocation) continue
    const progress = computeGoalProgress({
      detail,
      playerCharacter: params.playerCharacterById.get(detail.entityId),
      playerMow: params.playerMowById.get(detail.entityId),
      inventoryUpgrades: params.inventoryUpgrades.map((entry) => ({
        ...entry,
        upgradeId: entry.upgradeId as UpgradeId,
      })),
      inventoryItems: undefined,
      initialRarity: params.charactersById.get(detail.entityId)?.initialRarity,
      unlockShardCostsById: params.unlockShardCostsById,
      inventoryShard: params.inventoryShardById.get(detail.entityId),
    })
    const ratio = computePotentialProgressRatio(detail, progress, allocation)
    if (ratio !== null) potentialProgressByGoalId.set(detail.goalId, ratio)
  }

  let energyTotal = 0
  let completionDate: string | null = null
  let anyUnreachable = false
  for (const goal of goalNeeds) {
    const result = estimateResults.get(goal.goalId)
    if (!result || result.status === "Blocked") {
      anyUnreachable = true
      continue
    }
    energyTotal += result.energyTotal
    if (!completionDate || result.date > completionDate) {
      completionDate = result.date
    }
  }
  if (anyUnreachable) completionDate = null

  // Bottlenecks: the aggregated (not per-goal) remaining count for each distinct farmable resource,
  // ranked by energy-to-clear at its cheapest node — the resources most likely to gate the plan.
  const aggregatedNeeds = new Map<EstimateResourceId, number>()
  for (const goal of goalNeeds) {
    for (const need of goal.needs) {
      aggregatedNeeds.set(
        need.id,
        (aggregatedNeeds.get(need.id) ?? 0) + need.count
      )
    }
  }
  const bottlenecks: PlanInsightsBottleneck[] = [...aggregatedNeeds.entries()]
    .map(([id, count]) => {
      const nodes = selectFarmNodes(
        { id, count },
        combinedUpgradesById,
        params.battlesById
      )
      const cheapest = nodes[0]
      const energyToClear = cheapest
        ? Math.ceil(count / cheapest.dropRate) * cheapest.energyCost
        : Number.POSITIVE_INFINITY
      const label = resourceLabel(
        id,
        params.upgradesById,
        params.charactersById
      )
      return { id, label, energyToClear }
    })
    .filter((entry) => Number.isFinite(entry.energyToClear))
    .sort((a, b) => b.energyToClear - a.energyToClear)
    .slice(0, 5)

  const { campaignInsights, eventInsights } = computeCampaignInsights(
    campaignNeeds,
    combinedUpgradesById,
    params.battlesById,
    (groupId) => params.releaseTypeByGroupId.get(groupId) === "event",
    (descriptor, isEvent) =>
      isEvent
        ? params.campaignName(descriptor)
        : params.campaignFullLabel(descriptor)
  )

  const benefitingGoalIdsByInsightId = new Map<string, string[]>()
  for (const insight of [...campaignInsights, ...eventInsights]) {
    const goalIds = new Set<string>()
    for (const contribution of insight.contributions) {
      for (const goalId of provenance.get(contribution.upgradeId) ?? []) {
        goalIds.add(goalId)
      }
    }
    benefitingGoalIdsByInsightId.set(insight.id, [...goalIds])
  }

  const onslaughtDays =
    Math.max(
      0,
      onslaughtTokens - Math.max(0, params.currentOnslaughtTokens ?? 0)
    ) / 1.5
  if (onslaughtDays > 0) {
    const onslaughtDate = new Date()
    onslaughtDate.setUTCDate(
      onslaughtDate.getUTCDate() + Math.ceil(onslaughtDays)
    )
    const value = onslaughtDate.toISOString().slice(0, 10)
    if (!completionDate || value > completionDate) completionDate = value
  }

  return {
    totals,
    energyTotal,
    onslaughtTokens,
    onslaughtDays,
    estimates: estimateResults,
    potentialProgressByGoalId,
    completionDate,
    bottlenecks,
    campaignInsights,
    eventInsights,
    benefitingGoalIdsByInsightId,
  }
}
