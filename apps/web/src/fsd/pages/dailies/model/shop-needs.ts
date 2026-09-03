import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"
import {
  calculateGoalFarmingStages,
  calculateGoalResourceNeed,
  type FarmingCharacter,
  type FarmingUpgrade,
} from "@/features/goal-farming"

import { activeProjectMembers } from "./daily-raids-calc"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

/**
 * The four mythic upgrade materials the game never lets you craft — a goal's need for one can only be
 * met from a shop, so they're the one non-shard reward category this selector keys (V1 `MYTHIC_IDS`).
 */
export const MYTHIC_UPGRADE_NEED_IDS = [
  "upgHpM001",
  "upgHpM002",
  "upgHpM003",
  "upgHpM004",
] as const

const MYTHIC_UPGRADE_NEED_ID_SET = new Set<string>(MYTHIC_UPGRADE_NEED_IDS)

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
  /** Total needed (owned + still-outstanding), summed across contributing goals — matches V1's
   *  `acquiredCount`/`requiredCount` aggregation, which likewise sums the owned side per goal. */
  required: number
  neededBy: ShopNeedUnitEntry[]
}

/**
 * Keyed by the shop reward type string a resolved offer carries: `shards_<unitId>`,
 * `mythicShards_<unitId>`, or one of {@link MYTHIC_UPGRADE_NEED_IDS}.
 */
export type ShopNeedAggregate = ReadonlyMap<string, ShopResourceNeed>

export interface AggregateShopNeedsParams {
  members: ProjectGoalSummary[]
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
 * character shards, mythic character shards, and the four mythic uncraftable upgrade materials — into
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

  const abilityCoverageByEntity = new Map<
    string,
    { primary: Set<number>; secondary: Set<number> }
  >()

  const add = (
    key: string,
    owned: number,
    outstanding: number,
    unit: ShopNeedUnitEntry
  ) => {
    if (outstanding <= 0) return
    const current = aggregate.get(key) ?? {
      acquired: 0,
      required: 0,
      neededBy: [],
    }
    current.acquired += owned
    current.required += owned + outstanding
    current.neededBy.push(unit)
    aggregate.set(key, current)
  }

  for (const member of activeProjectMembers(params.members)) {
    const detail = detailById.get(member.goal.goalId)
    if (!detail) continue

    const entityId = detail.entityId as UnitId
    const isMow = detail.entityType === "Mow"
    const unitName = params.getUnitLabel(detail)

    const coverage = abilityCoverageByEntity.get(detail.entityId) ?? {
      primary: new Set<number>(),
      secondary: new Set<number>(),
    }
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
      if (!MYTHIC_UPGRADE_NEED_ID_SET.has(materialNeed.id)) continue
      mythicMaterialTotals.set(
        materialNeed.id,
        (mythicMaterialTotals.get(materialNeed.id) ?? 0) + materialNeed.count
      )
    }
    for (const [materialId, count] of mythicMaterialTotals) {
      add(
        materialId,
        params.inventoryUpgradeAmountById.get(materialId) ?? 0,
        count,
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
      add(`shards_${entityId}`, ownedShards, need.shards, {
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
