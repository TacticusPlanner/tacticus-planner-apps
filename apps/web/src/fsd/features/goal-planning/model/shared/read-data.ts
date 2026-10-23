import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { ReadState } from "@/shared/lib"

/** A read's value once it is ready; `undefined` while it loads or after it failed, which the Goals
 *  views treat alike (as "not loaded yet"), as they did before reads had an error state. */
export function readyData<T>(state: ReadState<T>): T | undefined {
  return state.status === "ready" ? state.data : undefined
}

/** `usePlayerChunk` selector: a never-synced chunk as `undefined`, the value the Goals views
 *  always read "not synced" as. */
export function chunkOrUndefined<T>(chunk: T | null): T | undefined {
  return chunk ?? undefined
}

/** `usePlayerChunk` selector for a split chunk's records by unit id (`characters`, `mows`,
 *  `inventory-shards`); an unsynced chunk gives an empty map. */
export function toByUnitId<T extends { unitId: string }>(
  records: T[] | null
): Map<string, T> {
  return new Map((records ?? []).map((record) => [record.unitId, record]))
}

type Inventory = PlayerDataChunkDto<"inventory">

/** `usePlayerChunk("inventory")` selectors for its parts. */
export const toXpBooks = (inventory: Inventory | null) => inventory?.xpBooks
export const toOrbs = (inventory: Inventory | null) => inventory?.orbs
export function toAbilityMaterials(
  inventory: Inventory | null
): Pick<Inventory, "abilityBadges" | "forgeBadges" | "components"> | undefined {
  if (!inventory) return undefined
  const { abilityBadges, forgeBadges, components } = inventory
  return { abilityBadges, forgeBadges, components }
}
