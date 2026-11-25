import type {
  AscensionCostStorageModel,
  CampaignDescriptor,
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import { campaignDescriptor } from "@workspace/game-catalog"
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
} from "@/entities/rank-lookup"
import type { GoalDetail } from "@/entities/goal"
import type { OnslaughtProgress } from "@/entities/player-data-override"

import {
  allocatePlanInventory,
  createCraftedInventoryPool,
  estimatePlan,
  resourceLabel,
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  computeGoalAcquisition,
  createUnitCoverage,
  isMowDetail,
  rankSlotAllocation,
  relabelHreOutcomes,
} from "@/entities/goal-farming"
import type {
  EstimateResourceId,
  EstimateUpgrade,
  GoalNeed,
  HreBlockedReason,
  LevelRules,
  UpgradeNeed,
  RankSlotAllocation,
  UnitCoverage,
} from "@/entities/goal-farming"
import { createAbilityMaterialsPlan } from "./plan-ability-materials"
import { buildPotentialProgressByGoalId } from "./potential-progress"
import {
  allocateOrbInventory,
  createOrbGoalNeed,
} from "./orb-potential-allocation"
import type { InventoryOrbs, OrbGoalNeed } from "./orb-potential-allocation"
import { buildLevelPotentialProgress } from "./level-potential-progress"
import { computeBottlenecks, netGoalNeeds } from "./plan-bottlenecks"
import { computeCampaignProgression } from "./plan-campaign-progression"
import { buildFarmingInsights } from "./plan-farming-insights"
import { createPlanMissingResources } from "./plan-missing-resources"
import { createPlanNetResources } from "./plan-net-resources"
import { computePlanUpgradeMaterials } from "./plan-upgrade-materials"
import { createStandaloneEstimates } from "./plan-standalone-estimates"
import type {
  PlanInsightsExcludedGoal,
  PlanInsightsGoalOutlook,
  PlanInsightsResult,
  PlanInsightsTotals,
} from "./use-plan-insights.domain"
import { firstDifference } from "@/shared/lib"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

/** The Insights view's full per-project aggregation (plan §16 phase 7) — pure, given every batch-
 *  fetched input `use-plan-insights.ts`'s hook gathers. See that file's doc comment for the overall
 *  shape/scope; kept here so the aggregation stays pure. */
export function computePlanInsights(params: {
  details: GoalDetail[]
  priorityByGoalId: ReadonlyMap<string, number>
  /** When set, only these goals count toward the aggregates (totals, energy, completion date,
   *  bottlenecks, campaign insights, the unestimated count). Every goal in `details` still takes part in
   *  the shared allocation and estimate, so a project view reports the outcome of the one global run:
   *  goals ranked above it in other projects consume inventory and energy first. */
  scopeGoalIds?: ReadonlySet<string>
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>
  playerMowById: ReadonlyMap<string, PlayerMow | undefined>
  inventoryShardById: ReadonlyMap<string, InventoryShard | undefined>
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  inventoryOrbs?: InventoryOrbs
  /** The account's XP-book inventory — netted against every Rank/Ability goal's level requirement, in
   *  priority order, for that goal's level Potential-progress ratio (see `level-potential-progress.ts`).
   *  Omitting it treats every goal as if no books were owned (no Potential ratio computed). */
  inventoryXpBooks?: readonly { xpBookId: string; amount: number }[]
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  battlesById: Parameters<typeof estimatePlan>[0]["battlesById"]
  /** The nodes the Insights farming cards rank over: `reached` (by progress, event nodes included
   *  while their event is not running) and `all` (every catalog node). Estimates, dates and
   *  bottlenecks keep reading the eligible `battlesById`; without it the cards use it too. */
  insightBattles?: {
    reached: Parameters<typeof estimatePlan>[0]["battlesById"]
    all: Parameters<typeof estimatePlan>[0]["battlesById"]
  }
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  /** Ability cost ladders for the Remaining chips' plan-wide materials (`abilityMaterialsByGoalId`). */
  abilityLadders?: Parameters<typeof createAbilityMaterialsPlan>[0]
  /** The account's ability badges, forge badges and MoW components, netted against Ability goals in
   *  priority order. Omitted, the ability materials stay gross of stock. */
  abilityInventory?: Parameters<typeof createAbilityMaterialsPlan>[1]
  /** The user's selected XP-book rarity, pricing the books a Rank goal still needs (Rank gold). */
  xpBookRarity?: string | null
  /** The game's level rules; omitted, no goal gets a level Potential ratio or level-up gold. */
  levelRules?: LevelRules
  releaseTypeByGroupId: ReadonlyMap<CampaignId, string>
  getCharacter: (unitId: UnitId) => Character | undefined
  campaignName: (descriptor: Pick<CampaignDescriptor, "nameKey">) => string
  campaignFullLabel: (descriptor: CampaignDescriptor) => string
  dailyEnergy?: number
  onslaughtProgress?: OnslaughtProgress
  /** Featured heroes' shard ids whose running or upcoming Hero Release Event supplies them
   *  (`hreShardReasons`): a goal blocked only on these reads as obtainable through the event. */
  hreShardReasons?: ReadonlyMap<EstimateResourceId, HreBlockedReason>
  currentOnslaughtTokens?: number
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  onslaughtRunsPerDay?: number
  /** The daily-shop dataset, used to resolve a goal's selected `Shop` acquisition-source ids back
   *  into offers with their per-day supply (tacticus-planner-apps#103). Omitting it treats every
   *  goal as if it selected no shop sources — the shared estimate still runs, just without that
   *  contribution. */
  shops?: readonly GameCatalogShop[]
  /** "Campaigns to push" inputs: every catalog battle, the player's campaign progress, the campaign
   *  definitions, the owned roster, Power Level and the Elite threshold. Omitted, no campaign
   *  progression is computed. */
  campaignProgression?: Omit<
    Parameters<typeof computeCampaignProgression>[0],
    | "goalNeeds"
    | "allocations"
    | "estimates"
    | "farmLocationsById"
    | "battlesById"
    | "isElite"
    | "label"
  >
}): PlanInsightsResult {
  const totals: PlanInsightsTotals = {
    upgradesByRarity: {},
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
  const abilityCoverageByEntity = new Map<string, UnitCoverage>()
  const rankSlotsByGoalId = new Map<string, RankSlotAllocation>()
  const abilityMaterials = createAbilityMaterialsPlan(
    params.abilityLadders,
    params.abilityInventory
  )
  const planNet = createPlanNetResources()
  const missing = createPlanMissingResources()
  const standalone = createStandaloneEstimates(
    params.inventoryUpgrades,
    params.upgradesById
  )
  let onslaughtTokens = 0
  // The whole plan's Onslaught token demand, scoped or not: the account's tokens are one budget shared by
  // every goal in the global run, so the wait for tokens is the plan's, never a project-only one.
  let planOnslaughtTokens = 0
  // One reference date for every goal's shop-supply projection in this pass, so two goals sharing a
  // shop offer see the same weekday-probability schedule.
  const referenceDate = new Date()
  const craftedInventory = createCraftedInventoryPool(
    params.inventoryUpgrades,
    params.upgradesById
  )

  const inScope = (goalId: string) =>
    !params.scopeGoalIds || params.scopeGoalIds.has(goalId)

  const addProvenance = (id: EstimateResourceId, goalId: string) => {
    const set = provenance.get(id) ?? new Set<string>()
    set.add(goalId)
    provenance.set(id, set)
  }

  // A canonical goal that belongs to several projects is one piece of work: listed once, then ordered.
  const orderedDetails = params.details
    .filter((d, i, all) => all.findIndex((o) => o.goalId === d.goalId) === i)
    .toSorted(
      (left, right) =>
        (params.priorityByGoalId.get(left.goalId) ?? Number.MAX_SAFE_INTEGER) -
        (params.priorityByGoalId.get(right.goalId) ?? Number.MAX_SAFE_INTEGER)
    )
  for (const detail of orderedDetails) {
    const entityId = detail.entityId as UnitId
    const coverage =
      abilityCoverageByEntity.get(detail.entityId) ?? createUnitCoverage()
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
      coveredRankSlots: coverage.rankSlots,
      ascensionCoverage: coverage,
      craftedInventory,
    }
    const alliance = (
      isMowDetail(detail) ? params.mowsById : params.charactersById
    ).get(detail.entityId)?.alliance
    abilityMaterials.add(detail, { ...needParams, alliance })
    if (inScope(detail.goalId)) {
      missing.addAbilityMaterials(
        abilityMaterials.byGoalId.get(detail.goalId),
        alliance
      )
    }
    planNet.add(detail, needParams, params.priorityByGoalId.get(detail.goalId))
    const slots =
      detail.goalType === "Rank" ? rankSlotAllocation(needParams) : null
    if (slots) rankSlotsByGoalId.set(detail.goalId, slots)
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
    const scoped = inScope(detail.goalId)
    planOnslaughtTokens += onslaughtTokensDelta
    if (scoped) {
      onslaughtTokens += onslaughtTokensDelta

      totals.shards += need.shards
      totals.mythicShards += need.mythicShards
    }

    // Upgrade materials are gross of base stock here; the totals, bottlenecks and campaign insights
    // read them after `allocatePlanInventory` below, so owned materials never count as missing.
    const needs: UpgradeNeed[] = [...need.upgrades]

    // A Machine of War's shards arrive here only when Onslaught or a shop supplies them; it has no
    // campaign nodes, so it never gets a catalog entry below.
    if (shardNeed) {
      needs.push(shardNeed)

      const characterView = params.charactersById.get(detail.entityId)
      if (
        need.shardId &&
        characterView &&
        !shardCatalogEntries.has(need.shardId)
      ) {
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

    // Onslaught-only, so it adds nothing to the campaign insights above.
    if (mythicShardNeed) needs.push(mythicShardNeed)

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

    standalone.add({ detail, needParams, slots, priority, flatSuppliers })
  }

  const combinedUpgradesById = new Map<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >([...params.upgradesById, ...shardCatalogEntries])

  const inventory: UpgradeNeed[] = params.inventoryUpgrades.map((entry) => ({
    id: entry.upgradeId as EstimateResourceId,
    count: entry.amount,
  }))

  const estimateResults = relabelHreOutcomes(
    estimatePlan({
      goals: goalNeeds,
      upgradesById: combinedUpgradesById,
      battlesById: params.battlesById,
      dailyEnergy: params.dailyEnergy ?? 288,
      inventory,
    }),
    params.hreShardReasons ?? new Map()
  )
  const standaloneByGoalId = standalone.resolve({
    upgradesById: combinedUpgradesById,
    battlesById: params.battlesById,
    dailyEnergy: params.dailyEnergy ?? 288,
    inventory,
  })
  const allocations = allocatePlanInventory(goalNeeds, inventory)

  // What each scoped goal still farms once owned stock is spent in priority order: the upgrade totals
  // and the campaign insights (with the goals each one helps) read this, never the gross need.
  const campaignNeeds: { id: EstimateResourceId; count: number }[] = []
  const missingById = new Map<EstimateResourceId, number>()
  for (const goal of goalNeeds) {
    if (!inScope(goal.goalId)) continue
    const net = netGoalNeeds(
      goal,
      allocations.get(goal.goalId),
      estimateResults.get(goal.goalId)
    )
    for (const [id, count] of net) {
      // Only true upgrade ids carry an upgrade rarity; shard ids fall through.
      const rarity = params.upgradesById.get(id as UpgradeId)?.rarity
      if (rarity) {
        totals.upgradesByRarity[rarity] =
          (totals.upgradesByRarity[rarity] ?? 0) + count
      }
      addProvenance(id, goal.goalId)
      campaignNeeds.push({ id, count })
      missingById.set(id, (missingById.get(id) ?? 0) + count)
    }
  }
  const orbAllocations = allocateOrbInventory(
    orbGoalNeeds,
    params.inventoryOrbs
  )
  const levelPotential = buildLevelPotentialProgress({
    orderedDetails,
    priorityByGoalId: params.priorityByGoalId,
    playerCharacterById: params.playerCharacterById,
    inventoryXpBooks: params.inventoryXpBooks,
    xpBookRarity: params.xpBookRarity,
    levelRules: params.levelRules,
  })
  for (const detail of orderedDetails) {
    if (!inScope(detail.goalId)) continue
    missing.addOrbAllocation(orbAllocations.get(detail.goalId))
    missing.addXp(levelPotential.remainingXpByGoalId.get(detail.goalId))
    missing.addGold(levelPotential.goldByGoalId.get(detail.goalId))
    missing.addGold(abilityMaterials.byGoalId.get(detail.goalId)?.gold)
  }
  // What each active goal still needs once the plan's orb and shard stock is spent in priority order,
  // plus the gold to apply a Rank goal's level-up books (goal-remaining-resources).
  const planNetByGoalId = planNet.resolve({
    orderedDetails,
    orbAllocations,
    inventoryOrbs: params.inventoryOrbs,
    levelGoldByGoalId: levelPotential.goldByGoalId,
    standaloneByGoalId,
    chainedFromLevelByGoalId: levelPotential.chainedFromLevelByGoalId,
  })

  const potentialProgressByGoalId = buildPotentialProgressByGoalId({
    orderedDetails,
    orbAllocations,
    allocations,
    playerCharacterById: params.playerCharacterById,
    playerMowById: params.playerMowById,
    inventoryUpgrades: params.inventoryUpgrades,
    charactersById: params.charactersById,
    unlockShardCostsById: params.unlockShardCostsById,
    inventoryShardById: params.inventoryShardById,
  })

  // The projected completion date is the latest date among the goals that *can* be estimated, and
  // `unestimatedGoalCount` reports the rest — a single blocked goal no longer erases the whole
  // plan's date (plan-completion-outlook). `energyTotal` has always been reported over this same
  // estimable subset; the date was the odd one out.
  let energyTotal = 0
  let completionDate: string | null = null
  const goalOutlook: PlanInsightsGoalOutlook[] = []
  const goalDates = new Map<string, string>()
  for (const goal of goalNeeds) {
    const result = estimateResults.get(goal.goalId)
    if (!result || result.status === "Blocked") continue
    goalDates.set(goal.goalId, result.date)
    if (!inScope(goal.goalId)) continue
    goalOutlook.push({
      goalId: goal.goalId,
      date: result.date,
      days: result.days,
    })
    energyTotal += result.energyTotal
    if (!completionDate || result.date > completionDate) {
      completionDate = result.date
    }
  }
  // Latest first: the head of the list is what sets the plan's date.
  goalOutlook.sort((left, right) =>
    firstDifference(right.date.localeCompare(left.date), right.days - left.days)
  )
  // Counted against the project's own goals, not `goalNeeds`: that array is already filtered above
  // (needs-or-stages plus a resolved priority), and an orb-only Ascension goal goes to
  // `orbGoalNeeds` instead — counting skips inside the loop would silently undercount and make a
  // project of such goals indistinguishable from an empty one.
  const estimatedGoalIds = new Set(goalOutlook.map((goal) => goal.goalId))
  const excludedGoals: PlanInsightsExcludedGoal[] = [
    ...new Set(
      params.details.filter((d) => inScope(d.goalId)).map((d) => d.goalId)
    ),
  ]
    .filter((goalId) => !estimatedGoalIds.has(goalId))
    .map((goalId) => {
      const estimate = estimateResults.get(goalId)
      return {
        goalId,
        reason:
          estimate?.status === "Blocked" ? estimate.reason : "NotEstimated",
      }
    })
  const unestimatedGoalCount = excludedGoals.length

  const { bottlenecks, blockers, costsById } = computeBottlenecks({
    goalNeeds: goalNeeds.filter((goal) => inScope(goal.goalId)),
    allocations,
    estimates: estimateResults,
    combinedUpgradesById,
    battlesById: params.battlesById,
    upgradesById: params.upgradesById,
    charactersById: params.charactersById,
    dailyEnergy: params.dailyEnergy ?? 288,
  })

  const { upgrades: upgradeMaterials, spareUpgrades } =
    computePlanUpgradeMaterials({
      goalNeeds,
      inScope,
      missingById,
      costsById,
      upgradesById: params.upgradesById,
      inventoryUpgrades: params.inventoryUpgrades,
    })

  const farmingInsightsOver = (
    battlesById: Parameters<typeof estimatePlan>[0]["battlesById"]
  ) =>
    buildFarmingInsights({
      needs: campaignNeeds,
      upgradesById: combinedUpgradesById,
      battlesById,
      isEventGroup: (groupId) =>
        params.releaseTypeByGroupId.get(groupId) === "event",
      resolveLabel: (descriptor, isEvent) =>
        isEvent
          ? params.campaignName(descriptor)
          : params.campaignFullLabel(descriptor),
      provenance,
      dailyEnergy: params.dailyEnergy ?? 288,
    })
  const reachedFarming = farmingInsightsOver(
    params.insightBattles?.reached ?? params.battlesById
  )
  const allLocations = farmingInsightsOver(
    params.insightBattles?.all ?? params.battlesById
  )

  const campaignProgression = params.campaignProgression
    ? computeCampaignProgression({
        ...params.campaignProgression,
        goalNeeds: goalNeeds.filter((goal) => inScope(goal.goalId)),
        allocations,
        estimates: estimateResults,
        farmLocationsById: combinedUpgradesById,
        battlesById: params.battlesById,
        isElite: (groupId) =>
          campaignDescriptor(groupId, "Elite")?.difficultyToken === "elite",
        label: (id) =>
          resourceLabel(id, params.upgradesById, params.charactersById),
      })
    : []

  // The token wait runs at the served Onslaught cadence (1.5 runs a day until it loads), so it
  // matches the shard supply above.
  const planOnslaughtDays =
    Math.max(
      0,
      planOnslaughtTokens - Math.max(0, params.currentOnslaughtTokens ?? 0)
    ) / (params.onslaughtRunsPerDay ?? 1.5)
  // A scoped view reports the wait only when its own goals need tokens, but the date below always
  // extends by the plan's wait: the project's goals queue behind everything ranked above them.
  const onslaughtDays = onslaughtTokens > 0 ? planOnslaughtDays : 0
  let onslaughtWaitDate: string | null = null
  if (planOnslaughtDays > 0) {
    const onslaughtDate = new Date()
    onslaughtDate.setUTCDate(
      onslaughtDate.getUTCDate() + Math.ceil(planOnslaughtDays)
    )
    const value = onslaughtDate.toISOString().slice(0, 10)
    onslaughtWaitDate = value
    // Extends an existing date, never creates one: with nothing estimable there is no plan date to
    // push out, and a bare token-accumulation day is a completion date anchored to no goal at all
    // (plan-completion-outlook).
    if (completionDate && value > completionDate) completionDate = value
  }

  return {
    totals,
    missing: missing.resolve(params.levelRules, params.xpBookRarity),
    energyTotal,
    onslaughtTokens,
    onslaughtDays,
    estimates: estimateResults,
    potentialProgressByGoalId,
    rankSlotsByGoalId,
    levelPotentialProgressByGoalId: levelPotential.ratioByGoalId,
    levelChargedXpByGoalId: levelPotential.chargedXpByGoalId,
    levelPoolXpAvailableByGoalId: levelPotential.poolXpAvailableByGoalId,
    abilityMaterialsByGoalId: abilityMaterials.byGoalId,
    planNetByGoalId,
    completionDate,
    unestimatedGoalCount,
    goalDates,
    plannedGoalIds: [...new Set(params.details.map((d) => d.goalId))],
    onslaughtWaitDate,
    goalOutlook,
    excludedGoals,
    bottlenecks,
    blockers,
    upgradeMaterials,
    spareUpgrades,
    ...reachedFarming,
    allLocations,
    campaignProgression,
  }
}
