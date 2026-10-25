import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  GameCatalogShop,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  firstProgression,
  progressionIndex,
  progressionOrder,
  progressionRarity,
  rankIndex,
  type Progression,
  type Rank,
  type UnitId,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { CombinedGoalSpec, GoalDetail } from "@/entities/goal"
import type { LegendaryEventRosterUnit } from "@/entities/legendary-event"
import {
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  computeGoalAcquisition,
  createCraftedInventoryPool,
  createUnitCoverage,
  estimatePlan,
  type EstimateResourceId,
  type EstimateUpgrade,
  type FarmingCharacter,
  type FarmingUpgrade,
  type GoalNeed,
  type UpgradeNeed,
} from "@/features/goal-farming"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]
type EstimateParams = Parameters<typeof estimatePlan>[0]

export interface UpgradeChainRequest {
  /** Character snowprint id. */
  unitId: string
  /** The unit's synced roster record; undefined when not owned (the chain then starts with Unlock). */
  from: LegendaryEventRosterUnit | undefined
  /** Target progression (Ascension goal end), when the chain ascends. */
  progressionEnd?: Progression
  /** Target rank (Rank goal end, 0 applied upgrades), when the chain ranks up. */
  rankEnd?: Rank
}

/** `null` means the chain is blocked (a need with no farmable source) or cannot be estimated. */
export type FarmingDays = { days: number; date: string } | null

/** The catalog and account inputs the estimator costs a chain against. */
export interface FarmingDaysInputs {
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  getCharacter: (unitId: UnitId) => FarmingCharacter | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  /** Only the account's eligible (farmable) campaign nodes. */
  battlesById: EstimateParams["battlesById"]
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  /** Daily-shop dataset: a Rank goal's Mythic materials draw on every available offer (the
   *  goals page's default when no source is saved). */
  shops?: readonly GameCatalogShop[]
  playerCharacterById: ReadonlyMap<string, PlayerCharacter>
  inventoryShardById: ReadonlyMap<string, InventoryShard>
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  dailyEnergy: number
  referenceDate?: Date
}

/**
 * The goals a wizard upgrade chain creates, in the shape `createCombinedGoals` sends: Unlock when
 * the unit is not owned, Ascension when `progressionEnd` is above the start, Rank when `rankEnd` is
 * above the current rank. Each spec depends on the earlier ones of the chain (mirrors the goals
 * page's `buildCombinedGoalSpecs`). `unlockProgression` is where an unowned unit starts ascending:
 * the first step of its starting rarity.
 */
export function upgradeChainGoalSpecs(
  request: UpgradeChainRequest,
  unlockProgression: Progression = firstProgression
): CombinedGoalSpec[] {
  const { from } = request
  const specs: CombinedGoalSpec[] = []
  let unlockIndex: number | null = null
  let ascensionIndex: number | null = null

  if (!from) {
    specs.push({ goalType: "Unlock", config: {}, dependsOnIndex: [] })
    unlockIndex = 0
  }

  const progressionStart = from?.progressionIndex ?? unlockProgression
  if (
    request.progressionEnd &&
    progressionIndex(request.progressionEnd) >
      progressionIndex(progressionStart)
  ) {
    specs.push({
      goalType: "Ascension",
      config: {
        progression: { start: progressionStart, end: request.progressionEnd },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
    ascensionIndex = specs.length - 1
  }

  const rankStart = from ? rankIndex(from.rank) : 0
  if (request.rankEnd && rankIndex(request.rankEnd) > rankStart) {
    specs.push({
      goalType: "Rank",
      config: {
        farmingStrategy: "TotalUpgrades",
        rank: {
          start: rankStart,
          startPointFive: false,
          startAppliedUpgrades: 0,
          end: rankIndex(request.rankEnd),
          endPointFive: false,
          endAppliedUpgrades: 0,
        },
      },
      dependsOnIndex: [unlockIndex, ascensionIndex].filter(
        (index): index is number => index !== null
      ),
    })
  }

  return specs
}

/** Placeholder details for the chain's specs — just enough shape for the goal-farming need
 *  calculations (trimmed from the goals page's `buildPreviewGoalDetails`). */
function previewDetails(
  unitId: string,
  specs: readonly CombinedGoalSpec[]
): GoalDetail[] {
  return specs.map((spec, index) => ({
    goalId: `chain-${index}`,
    entityType: "Character",
    entityId: unitId,
    goalType: spec.goalType,
    status: "Paused",
    globalPriority: null,
    notes: null,
    createdAt: "",
    updatedAt: "",
    config: {
      rank: spec.config.rank ?? null,
      progression: spec.config.progression ?? null,
      ability: null,
      farmingStrategy: spec.config.farmingStrategy ?? "TotalUpgrades",
      acquisitionSources: null,
      farmingLocationIds: null,
      upgrade: null,
    },
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: [],
    revision: 0,
  }))
}

/** The synced record the need calculations read, with the chain's starting rank and progression.
 *  Applied slots and shards carry over only while they still describe that starting point. */
function chainStartRecord(
  from: LegendaryEventRosterUnit | undefined,
  synced: PlayerCharacter | undefined
): PlayerCharacter | undefined {
  if (!from) return undefined
  const sameRank = synced?.rank === from.rank
  const sameProgression = synced?.progressionIndex === from.progressionIndex
  return {
    xp: 0,
    xpLevel: 1,
    abilities: [],
    equippedItems: [],
    ...synced,
    unitId: from.unitId,
    rank: from.rank,
    progressionIndex: from.progressionIndex,
    appliedUpgradeSlots:
      from.appliedUpgradeSlots ?? (sameRank ? synced.appliedUpgradeSlots : []),
    shards: sameProgression ? synced.shards : 0,
    mythicShards: sameProgression ? synced.mythicShards : 0,
  }
}

function requestKey(request: UpgradeChainRequest) {
  const { from } = request
  return [
    request.unitId,
    from?.rank ?? "-",
    from?.progressionIndex ?? "-",
    from?.appliedUpgradeSlots?.join(".") ?? "-",
    request.progressionEnd ?? "-",
    request.rankEnd ?? "-",
  ].join("|")
}

/**
 * A synchronous, memoized "how many farming days" estimate for one wizard upgrade chain, farmed on
 * its own: only the chain's goals, the account's current inventory and daily energy. Reuses the
 * goal-farming engine exactly as the goals page's Insights does (`computePlanInsights`), trimmed
 * to the per-goal estimate: needs, default acquisition (campaign shards, every Mythic-material shop
 * offer), then one `estimatePlan` run over the chain in order.
 */
export function createFarmingDaysEstimator(
  inputs: FarmingDaysInputs
): (request: UpgradeChainRequest) => FarmingDays {
  const cache = new Map<string, FarmingDays>()
  const shared = sharedEstimateInputs(inputs)
  return (request) => {
    const key = requestKey(request)
    if (cache.has(key)) return cache.get(key) ?? null
    const result = estimateChain(inputs, shared, request)
    cache.set(key, result)
    return result
  }
}

interface SharedEstimateInputs {
  /** The upgrades map with a chain's shard entries added; the base map when there are none. */
  upgradesWith: (
    shardEntries: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  ) => ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  inventory: { id: EstimateResourceId; count: number }[]
}

/** Inputs every chain estimate shares, built once per estimator instead of once per chain. */
function sharedEstimateInputs(inputs: FarmingDaysInputs): SharedEstimateInputs {
  const base = new Map<EstimateResourceId, EstimateUpgrade>(inputs.upgradesById)
  const withShards = new Map<
    string,
    ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  >()
  return {
    upgradesWith: (shardEntries) => {
      if (shardEntries.size === 0) return base
      const key = [...shardEntries.keys()].toSorted().join("|")
      const cached = withShards.get(key)
      if (cached) return cached
      const map = new Map([...base, ...shardEntries])
      withShards.set(key, map)
      return map
    },
    inventory: inputs.inventoryUpgrades.map((entry) => ({
      id: entry.upgradeId as EstimateResourceId,
      count: entry.amount,
    })),
  }
}

function estimateChain(
  inputs: FarmingDaysInputs,
  shared: SharedEstimateInputs,
  request: UpgradeChainRequest
): FarmingDays {
  const characterView = inputs.charactersById.get(request.unitId)
  if (!characterView) return null
  const referenceDate = inputs.referenceDate ?? new Date()
  const today = referenceDate.toISOString().slice(0, 10)

  const unlockProgression = firstOfRarity(characterView.initialRarity)
  const details = previewDetails(
    request.unitId,
    upgradeChainGoalSpecs(request, unlockProgression)
  )
  if (details.length === 0) return { days: 0, date: today }

  const playerCharacter = chainStartRecord(
    request.from,
    inputs.playerCharacterById.get(request.unitId)
  )
  const playerCharacterById = new Map([[request.unitId, playerCharacter]])
  const coverage = createUnitCoverage()
  const craftedInventory = createCraftedInventoryPool(
    inputs.inventoryUpgrades,
    inputs.upgradesById
  )
  const goals: GoalNeed[] = []
  const shardEntries = new Map<EstimateResourceId, EstimateUpgrade>()

  details.forEach((detail, priority) => {
    const needParams = {
      detail,
      character: inputs.getCharacter(request.unitId as UnitId),
      characterView,
      mow: undefined,
      playerCharacter,
      playerMow: undefined,
      inventoryShard: request.from
        ? undefined
        : inputs.inventoryShardById.get(request.unitId),
      upgradesById: inputs.upgradesById,
      ascensionCostsById: inputs.ascensionCostsById,
      unlockShardCostsById: inputs.unlockShardCostsById,
      coveredAbilityTransitions: coverage,
      coveredRankSlots: coverage.rankSlots,
      craftedInventory,
    }
    const stages = calculateGoalFarmingStages(needParams)
    const need =
      stages === null
        ? calculateGoalResourceNeed(needParams)
        : {
            upgrades: stages.flatMap((stage) => stage.needs),
            shardId: null,
            shards: 0,
          }
    if (!need) return

    const { flatSuppliers } = computeGoalAcquisition({
      detail,
      need: { ...need, mythicShards: 0 },
      mowsById: new Map(),
      charactersById: inputs.charactersById,
      playerCharacterById,
      playerMowById: new Map(),
      shops: inputs.shops,
      referenceDate,
    })

    const needs: UpgradeNeed[] = [...need.upgrades]
    if (need.shardId && need.shards > 0) {
      needs.push({ id: need.shardId, count: need.shards })
      shardEntries.set(need.shardId, {
        id: need.shardId,
        farmLocations: characterView.shardLocations,
      })
    }
    if (needs.length === 0 && stages === null) return
    goals.push({
      goalId: detail.goalId,
      priority,
      needs,
      stages: stages ?? undefined,
      flatSuppliers: flatSuppliers.length > 0 ? flatSuppliers : undefined,
    })
  })

  if (goals.length === 0) return { days: 0, date: today }

  const outcomes = estimatePlan({
    goals,
    upgradesById: shared.upgradesWith(shardEntries),
    battlesById: inputs.battlesById,
    dailyEnergy: inputs.dailyEnergy,
    inventory: shared.inventory,
    referenceDate,
  })

  let days = 0
  let date = today
  for (const goal of goals) {
    const outcome = outcomes.get(goal.goalId)
    if (!outcome || outcome.status === "Blocked") return null
    if (outcome.days > days) days = outcome.days
    if (outcome.date > date) date = outcome.date
  }
  return { days, date }
}

/** Where an unowned unit starts ascending once unlocked: the first ladder step of its starting
 *  rarity (`startingProgression`, without its throw on an unknown rarity). */
function firstOfRarity(rarity: string | undefined): Progression {
  return (
    progressionOrder.find((value) => progressionRarity(value) === rarity) ??
    firstProgression
  )
}
