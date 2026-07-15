import type {
  AscensionCostStorageModel,
  CampaignDescriptor,
  CharacterStorageModel,
  MowStorageModel,
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
import { computeCampaignInsights } from "@/shared/lib"

import { estimatePlan, selectFarmNodes } from "./estimate/estimate"
import {
  DAILY_ENERGY,
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalNeed,
  type MaterialNeed,
} from "./estimate/estimate.domain"
import {
  abilityResourceNeed,
  rankResourceNeed,
  resourceLabel,
} from "./plan-insights-need"
import {
  ascensionResourceNeed,
  shardsResourceNeed,
  unlockResourceNeed,
  type ResourceNeed,
} from "./progression-cost-calc"
import type {
  PlanInsightsBottleneck,
  PlanInsightsResult,
  PlanInsightsTotals,
} from "./use-plan-insights.domain"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

function goalResourceNeed(params: {
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
}): ResourceNeed | null {
  const { detail, upgradesById } = params
  const isMow = detail.entityType === "Mow"

  if (detail.goalType === "Rank") {
    const materials = rankResourceNeed({
      detail,
      character: params.character,
      playerCharacter: params.playerCharacter,
      upgradesById,
    })
    return materials
      ? { materials, shardId: null, shards: 0, mythicShards: 0, orbsByType: {} }
      : null
  }

  if (detail.goalType === "Ability") {
    const materials = abilityResourceNeed({
      detail,
      mow: params.mow,
      playerMow: params.playerMow,
      upgradesById,
    })
    return materials
      ? { materials, shardId: null, shards: 0, mythicShards: 0, orbsByType: {} }
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

  if (detail.goalType === "Shards" && detail.config.shards) {
    return shardsResourceNeed({
      count: detail.config.shards.count,
      entityId: detail.entityId,
      isMow,
    })
  }

  return null
}

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
}): PlanInsightsResult {
  const totals: PlanInsightsTotals = {
    materialsByRarity: {},
    orbsByType: {},
    shards: 0,
    mythicShards: 0,
  }

  const goalNeeds: GoalNeed[] = []
  const provenance = new Map<EstimateResourceId, Set<string>>()
  const shardCatalogEntries = new Map<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >()
  const campaignNeeds: { id: EstimateResourceId; count: number }[] = []

  const addProvenance = (id: EstimateResourceId, goalId: string) => {
    const set = provenance.get(id) ?? new Set<string>()
    set.add(goalId)
    provenance.set(id, set)
  }

  for (const detail of params.details) {
    const entityId = detail.entityId as UnitId
    const need = goalResourceNeed({
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
    })
    if (!need) continue

    totals.shards += need.shards
    totals.mythicShards += need.mythicShards
    for (const [rarity, count] of Object.entries(need.orbsByType)) {
      totals.orbsByType[rarity as Rarity] =
        (totals.orbsByType[rarity as Rarity] ?? 0) + (count ?? 0)
    }

    const needs: MaterialNeed[] = []
    for (const material of need.materials) {
      // `need.materials` only ever holds true upgrade ids (progression-cost-calc.ts's Ascension/
      // Unlock/Shards needs never populate it; only Rank/Ability do) — `EstimateResourceId`'s wider
      // union is a typing artifact of sharing `MaterialNeed` with the shard-aware engine.
      const rarity = params.upgradesById.get(material.id as UpgradeId)?.rarity
      if (rarity) {
        totals.materialsByRarity[rarity] =
          (totals.materialsByRarity[rarity] ?? 0) + material.count
      }
      addProvenance(material.id, detail.goalId)
      campaignNeeds.push({ id: material.id, count: material.count })
      needs.push(material)
    }

    if (need.shardId && need.shards > 0) {
      needs.push({ id: need.shardId, count: need.shards })
      addProvenance(need.shardId, detail.goalId)
      campaignNeeds.push({ id: need.shardId, count: need.shards })

      const characterView = params.charactersById.get(detail.entityId)
      if (characterView && !shardCatalogEntries.has(need.shardId)) {
        // `rarity` here is only for computeCampaignInsights's value-weighting formula (it has no
        // farmable-resource concept of its own rarity) — the character's own starting rarity is the
        // natural stand-in, mirroring how a higher-rarity character's shards are scarcer/more
        // valuable in-game. The estimate engine below never reads this field.
        shardCatalogEntries.set(need.shardId, {
          id: need.shardId,
          rarity: characterView.initialRarity,
          farmLocations: characterView.shardLocations,
        })
      }
    }

    const priority = params.priorityByGoalId.get(detail.goalId)
    if (needs.length > 0 && priority !== undefined) {
      goalNeeds.push({ goalId: detail.goalId, priority, needs })
    }
  }

  const combinedUpgradesById = new Map<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >([...params.upgradesById, ...shardCatalogEntries])

  const inventory: MaterialNeed[] = params.inventoryUpgrades.map((entry) => ({
    id: entry.upgradeId as EstimateResourceId,
    count: entry.amount,
  }))

  const estimateResults = estimatePlan({
    goals: goalNeeds,
    upgradesById: combinedUpgradesById,
    battlesById: params.battlesById,
    dailyEnergy: DAILY_ENERGY,
    inventory,
  })

  let energyTotal = 0
  let completionDate: string | null = null
  let anyUnreachable = false
  for (const goal of goalNeeds) {
    const result = estimateResults.get(goal.goalId)
    if (!result) {
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

  return {
    totals,
    energyTotal,
    completionDate,
    bottlenecks,
    campaignInsights,
    eventInsights,
    benefitingGoalIdsByInsightId,
  }
}
