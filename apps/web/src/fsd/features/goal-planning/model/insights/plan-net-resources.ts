import type { Rarity } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  allocateInventory,
  calculateGoalResourceNeed,
  isMowDetail,
} from "@/features/goal-farming/@x/goal-planning"
import type {
  GoalInventoryAllocation,
  InventoryAllocationGoal,
} from "@/features/goal-farming/@x/goal-planning"

import type { InventoryOrbs } from "./orb-potential-allocation"
import type { PlanNetResources } from "./use-plan-insights.domain"

type ShardGoalNeed = InventoryAllocationGoal<string>

const shardPoolId = (entityId: string, mythic: boolean) =>
  `${mythic ? "mythic" : "shards"}:${entityId}`

/** A goal's gross shard demand against its unit's own shard stock; `null` when it needs none. */
function createShardGoalNeed(params: {
  goalId: string
  priority: number | undefined
  entityId: string
  shards: number
  mythicShards: number
}): ShardGoalNeed | null {
  if (params.priority === undefined) return null
  const needs = [
    { id: shardPoolId(params.entityId, false), count: params.shards },
    { id: shardPoolId(params.entityId, true), count: params.mythicShards },
  ].filter((need) => need.count > 0)
  return needs.length > 0
    ? { goalId: params.goalId, priority: params.priority, needs }
    : null
}

/** Spends each unit's owned shards on its goals in priority order (a higher-priority goal for the
 *  same unit takes stock first) and returns each goal's shortfall. `ownedByEntityId` holds
 *  `[regular, mythic]` shards owned per unit. */
function allocateShardInventory(
  goals: readonly ShardGoalNeed[],
  ownedByEntityId: ReadonlyMap<string, readonly [number, number]>
) {
  const held = [...ownedByEntityId].flatMap(([entityId, [regular, mythic]]) => [
    { id: shardPoolId(entityId, false), count: regular },
    { id: shardPoolId(entityId, true), count: mythic },
  ])
  return allocateInventory(goals, held)
}

/** What one goal still needs of a resource after allocation, keyed by resource id. */
function remainingById(
  allocation: GoalInventoryAllocation<string> | undefined
): Map<string, number> {
  const left = new Map<string, number>()
  for (const need of allocation?.stages[0]?.remaining ?? []) {
    left.set(need.id, need.count)
  }
  return left
}

const shardShortfall = (
  allocation: GoalInventoryAllocation<string> | undefined,
  entityId: string
) => {
  const left = remainingById(allocation)
  return {
    shards: left.get(shardPoolId(entityId, false)) ?? 0,
    mythicShards: left.get(shardPoolId(entityId, true)) ?? 0,
  }
}

/** Each orb rarity a goal needs beside the stock left at its turn, then spends its share of `stock`
 *  (the allocation's needs minus what it still lacks) for the lower-priority goals. */
function takeOrbPool(
  allocation: GoalInventoryAllocation<string> | undefined,
  stock: Map<string, number>
): NonNullable<PlanNetResources["orbPool"]> {
  const neededByRarity: Partial<Record<Rarity, number>> = {}
  const availableByRarity: Partial<Record<Rarity, number>> = {}
  const left = remainingById(allocation)
  for (const need of allocation?.stages[0]?.needs ?? []) {
    const rarity = need.id.split(":")[2] as Rarity
    const held = stock.get(need.id) ?? 0
    neededByRarity[rarity] = (neededByRarity[rarity] ?? 0) + need.count
    availableByRarity[rarity] = (availableByRarity[rarity] ?? 0) + held
    stock.set(need.id, held - (need.count - (left.get(need.id) ?? 0)))
  }
  return { neededByRarity, availableByRarity }
}

/** Orb ids look like `orb:<alliance>:<Rarity>`; this returns a goal's shortfall by rarity. */
function orbShortfall(
  allocation: GoalInventoryAllocation<string> | undefined
): Partial<Record<Rarity, number>> {
  const byRarity: Partial<Record<Rarity, number>> = {}
  for (const [id, count] of remainingById(allocation)) {
    const rarity = id.split(":")[2] as Rarity
    byRarity[rarity] = (byRarity[rarity] ?? 0) + count
  }
  return byRarity
}

type NeedParams = Parameters<typeof calculateGoalResourceNeed>[0]

/** Collects each Ascension/Unlock goal's gross shard demand as the plan walks its goals in priority
 *  order (`add`), then `resolve`s what every active goal still needs of orbs and shards once the shared
 *  stock is spent in that order, plus each Rank goal's level-up gold. A goal without an entry (paused)
 *  keeps its standalone need. */
export function createPlanNetResources() {
  const goals: ShardGoalNeed[] = []
  const grossAscensionShards = new Map<
    string,
    { shards: number; mythicShards: number }
  >()
  const ownedByEntityId = new Map<string, readonly [number, number]>()

  const add = (
    detail: GoalDetail,
    needParams: NeedParams,
    priority: number | undefined
  ) => {
    if (detail.goalType !== "Ascension" && detail.goalType !== "Unlock") return
    // Gross demand: the unit's own stock zeroed, so the stock is spent once, in priority order.
    const gross = calculateGoalResourceNeed({
      ...needParams,
      playerCharacter: needParams.playerCharacter && {
        ...needParams.playerCharacter,
        shards: 0,
        mythicShards: 0,
      },
      playerMow: needParams.playerMow && {
        ...needParams.playerMow,
        shards: 0,
        mythicShards: 0,
      },
      inventoryShard: undefined,
    })
    const owned = isMowDetail(detail)
      ? needParams.playerMow
      : needParams.playerCharacter
    ownedByEntityId.set(
      detail.entityId,
      detail.goalType === "Ascension"
        ? [owned?.shards ?? 0, owned?.mythicShards ?? 0]
        : [needParams.inventoryShard?.amount ?? 0, 0]
    )
    const goal = gross
      ? createShardGoalNeed({
          goalId: detail.goalId,
          priority,
          entityId: detail.entityId,
          shards: gross.shards,
          mythicShards: gross.mythicShards,
        })
      : null
    if (goal) goals.push(goal)
    if (gross && detail.goalType === "Ascension") {
      grossAscensionShards.set(detail.goalId, {
        shards: gross.shards,
        mythicShards: gross.mythicShards,
      })
    }
  }

  const resolve = (params: {
    orderedDetails: readonly GoalDetail[]
    orbAllocations: ReadonlyMap<string, GoalInventoryAllocation<string>>
    inventoryOrbs?: InventoryOrbs
    levelGoldByGoalId: ReadonlyMap<string, number>
    standaloneByGoalId: ReadonlyMap<string, { slots: number; energy: number }>
    chainedFromLevelByGoalId: ReadonlyMap<string, number>
  }) => {
    const shardAllocations = allocateShardInventory(goals, ownedByEntityId)
    const netByGoalId = new Map<string, PlanNetResources>()
    const orbStock = new Map<string, number>()
    for (const alliance of ["imperial", "xenos", "chaos"] as const) {
      for (const entry of params.inventoryOrbs?.[alliance] ?? []) {
        orbStock.set(`orb:${alliance}:${entry.rarity}`, entry.amount)
      }
    }
    for (const detail of params.orderedDetails) {
      const net: PlanNetResources = {}
      if (detail.goalType === "Ascension" || detail.goalType === "Unlock") {
        Object.assign(
          net,
          shardShortfall(shardAllocations.get(detail.goalId), detail.entityId)
        )
      }
      const gross = grossAscensionShards.get(detail.goalId)
      if (gross) {
        net.shardProgress = {
          shards: {
            owned: gross.shards - (net.shards ?? 0),
            needed: gross.shards,
          },
          mythicShards: {
            owned: gross.mythicShards - (net.mythicShards ?? 0),
            needed: gross.mythicShards,
          },
        }
      }
      if (
        detail.goalType === "Ascension" &&
        params.orbAllocations.has(detail.goalId)
      ) {
        const allocation = params.orbAllocations.get(detail.goalId)
        net.orbsByType = orbShortfall(allocation)
        net.orbPool = takeOrbPool(allocation, orbStock)
      }
      const levelGold = params.levelGoldByGoalId.get(detail.goalId)
      if (detail.goalType === "Rank" && levelGold !== undefined) {
        net.levelGold = levelGold
      }
      const standalone = params.standaloneByGoalId.get(detail.goalId)
      if (standalone) net.standalone = standalone
      const chainedFrom = params.chainedFromLevelByGoalId.get(detail.goalId)
      if (chainedFrom !== undefined) net.levelChainedFrom = chainedFrom
      if (Object.keys(net).length > 0) netByGoalId.set(detail.goalId, net)
    }
    return netByGoalId
  }

  return { add, resolve }
}
