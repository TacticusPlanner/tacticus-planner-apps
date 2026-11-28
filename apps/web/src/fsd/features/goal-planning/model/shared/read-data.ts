import type { PlayerDataChunkDto } from "@workspace/player-data"

/** `usePlayerChunk` selector: a never-synced chunk as `undefined`, the value the Goals views
 *  always read "not synced" as. */
export function chunkOrUndefined<T>(chunk: T | null): T | undefined {
  return chunk ?? undefined
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
