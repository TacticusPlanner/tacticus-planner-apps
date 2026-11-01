import {
  isUncraftableMythicUpgrade,
  type AscensionCostStorageModel,
  type CharacterStorageModel,
  type MowStorageModel,
  type UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import {
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  createUnitCoverage,
  type FarmingCharacter,
  type FarmingUpgrade,
  type UnitCoverage,
} from "@/features/goal-farming/@x/shop-recommendations"

import { activeProjectMembers } from "@/features/daily-raids/@x/shop-recommendations"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

/** One project goal-unit that still needs a given shop resource, and how much of it. */
export interface ShopNeedUnitEntry {
  unitId: string
  unitName: string
  count: number
}

/** Aggregated outstanding need for one shop reward resource across a project's Active goals. */
interface ShopResourceNeed {
  /** How much of the resource the player already has toward the aggregated requirement. */
  acquired: number
  /** Total needed across contributing goals. Owned stock is counted once per resource, never once per
   *  goal: a gross need (Mythic materials) sums the goals' full counts, and a net need (shards, already
   *  netted against owned) is owned + the goals' summed outstanding counts. */
  required: number
  neededBy: ShopNeedUnitEntry[]
}

/**
 * Keyed by the shop reward type string a resolved offer carries: `shards_<unitId>`,
 * `mythicShards_<unitId>`, or the id of a Mythic upgrade material the game never lets you craft (a
 * need for one can only be met from a shop — see `isUncraftableMythicUpgrade`).
 */
export type ShopNeedAggregate = ReadonlyMap<string, ShopResourceNeed>

export interface AggregateShopNeedsParams {
  members: { goal: GoalDetail }[]
  details: GoalDetail[]
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>
  playerMowById: ReadonlyMap<string, PlayerMow | undefined>
  inventoryShardById: ReadonlyMap<string, InventoryShard | undefined>
  /** Owned count per upgrade id, from the `inventory-upgrades` chunk. */
  inventoryUpgradeAmountById: ReadonlyMap<string, number>
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  getCharacter: (unitId: UnitId) => FarmingCharacter | undefined
  getUnitLabel: (detail: GoalDetail) => string
}

/**
 * For a project's `Active` goals, aggregates the outstanding need per shop-available reward resource —
 * character shards, mythic character shards, and the uncraftable Mythic upgrade materials — into
 * `{ acquired, required, neededBy }`, derived from `goal-farming`'s per-goal resource-need calc rather
 * than the daily-raid farm schedule (so count-only / non-farmable needs still count). Goals that are
 * not `Active` never contribute (via {@link activeProjectMembers}).
 *
 * Forge badges (`itemAscensionResource_<Rarity>`) and MoW component / component-token needs are out of
 * scope — V2's goal model derives no need for them (tracked as TacticusPlanner/tacticus-planner-apps#104).
 */
export function aggregateShopNeeds(
  params: AggregateShopNeedsParams
): ShopNeedAggregate {
  const detailById = new Map(
    params.details.map((detail) => [detail.goalId, detail])
  )
  const aggregate = new Map<string, ShopResourceNeed>()

  const abilityCoverageByEntity = new Map<string, UnitCoverage>()

  // Owned stock is one pool per resource, so it seeds `acquired` (and, for a net need, `required`) only
  // when the resource is first seen; each further goal adds just its own count.
  const add = (
    key: string,
    owned: number,
    count: number,
    kind: "gross" | "net",
    unit: ShopNeedUnitEntry
  ) => {
    if (count <= 0) return
    let current = aggregate.get(key)
    if (!current) {
      current = {
        acquired: owned,
        required: kind === "net" ? owned : 0,
        neededBy: [],
      }
      aggregate.set(key, current)
    }
    current.required += count
    current.neededBy.push(unit)
  }

  const countedGoalIds = new Set<string>()
  for (const member of activeProjectMembers(params.members)) {
    const detail = detailById.get(member.goal.goalId)
    if (!detail || countedGoalIds.has(detail.goalId)) continue
    countedGoalIds.add(detail.goalId)

    const entityId = detail.entityId as UnitId
    const isMow = detail.entityType === "Mow"
    const unitName = params.getUnitLabel(detail)

    const coverage =
      abilityCoverageByEntity.get(detail.entityId) ?? createUnitCoverage()
    abilityCoverageByEntity.set(detail.entityId, coverage)

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
    }

    // Mythic uncraftable materials — from the per-stage material needs when the goal is staged,
    // otherwise the flat need (mirrors calculateDailyRaids' `stages ?? need` selection).
    const stages = calculateGoalFarmingStages(requirementParams)
    const need = calculateGoalResourceNeed(requirementParams)
    const materialNeeds = stages
      ? stages.flatMap((stage) => stage.needs)
      : (need?.upgrades ?? [])
    const mythicMaterialTotals = new Map<string, number>()
    for (const materialNeed of materialNeeds) {
      const upgrade = params.upgradesById.get(materialNeed.id as UpgradeId)
      if (!upgrade || !isUncraftableMythicUpgrade(upgrade)) continue
      mythicMaterialTotals.set(
        materialNeed.id,
        (mythicMaterialTotals.get(materialNeed.id) ?? 0) + materialNeed.count
      )
    }
    for (const [materialId, count] of mythicMaterialTotals) {
      add(
        materialId,
        params.inventoryUpgradeAmountById.get(materialId) ?? 0,
        // The rank need is the full material count for the goal's unapplied slots, not netted
        // against inventory, so owned stock must not be added on top of it.
        count,
        "gross",
        {
          unitId: entityId,
          unitName,
          count,
        }
      )
    }

    if (!need) continue

    // Regular character shards (Unlock / pre-mythic Ascension).
    if (need.shardId && need.shards > 0) {
      const ownedShards =
        detail.goalType === "Unlock"
          ? (params.inventoryShardById.get(detail.entityId)?.amount ?? 0)
          : (params.playerCharacterById.get(detail.entityId)?.shards ?? 0)
      add(`shards_${entityId}`, ownedShards, need.shards, "net", {
        unitId: entityId,
        unitName,
        count: need.shards,
      })
    }

    // Mythic character/MoW shards (Ascension into the Mythic tier).
    if (need.mythicShards > 0) {
      const owned = isMow
        ? params.playerMowById.get(detail.entityId)
        : params.playerCharacterById.get(detail.entityId)
      add(
        `mythicShards_${entityId}`,
        owned?.mythicShards ?? 0,
        need.mythicShards,
        "net",
        {
          unitId: entityId,
          unitName,
          count: need.mythicShards,
        }
      )
    }
  }

  return aggregate
}
