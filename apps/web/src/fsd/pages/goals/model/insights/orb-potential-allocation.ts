import type { Rarity } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { allocateInventory } from "@/features/goal-farming"
import type {
  CountedResourceNeed,
  InventoryAllocationGoal,
} from "@/features/goal-farming"

type OrbResourceId = `orb:${string}:${Rarity}`
export type InventoryOrbs = PlayerDataChunkDto<"inventory">["orbs"]
export type OrbGoalNeed = InventoryAllocationGoal<OrbResourceId>

function orbResourceId(alliance: string, rarity: Rarity): OrbResourceId {
  return `orb:${alliance.toLowerCase()}:${rarity}`
}

export function createOrbGoalNeed(params: {
  goalId: string
  priority: number | undefined
  alliance: string | undefined
  orbsByType: Partial<Record<Rarity, number>>
}): OrbGoalNeed | null {
  if (params.priority === undefined || !params.alliance) return null
  const needs = (Object.entries(params.orbsByType) as [Rarity, number][])
    .filter(([, count]) => count > 0)
    .map(([rarity, count]) => ({
      id: orbResourceId(params.alliance!, rarity),
      count,
    }))
  return needs.length > 0
    ? { goalId: params.goalId, priority: params.priority, needs }
    : null
}

export function allocateOrbInventory(
  goals: readonly OrbGoalNeed[],
  inventory: InventoryOrbs | undefined
) {
  const alliances = ["imperial", "xenos", "chaos"] as const
  const held: CountedResourceNeed<OrbResourceId>[] = alliances.flatMap(
    (alliance) =>
      (inventory?.[alliance] ?? []).map((entry) => ({
        id: orbResourceId(alliance, entry.rarity),
        count: entry.amount,
      }))
  )
  return allocateInventory(goals, held)
}
