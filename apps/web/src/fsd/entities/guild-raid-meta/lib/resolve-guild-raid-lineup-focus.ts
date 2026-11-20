type GuildRaidFocusSlot = {
  essential: boolean
  picked: unknown
  readiness?: number
}

export type GuildRaidLineupFocus = {
  /** Slots with no owned option, in lineup order. */
  emptySlotIndexes: number[]
  /** The filled slot furthest below the target: the weakest essential slot when one is under 100%,
   * otherwise the weakest other slot; `null` when every filled slot is at 100% or no percentages are
   * known. */
  weakestSlotIndex: number | null
}

function weakestIndex(
  slots: readonly GuildRaidFocusSlot[],
  include: (slot: GuildRaidFocusSlot) => boolean
): number | null {
  let weakest: { index: number; readiness: number } | null = null
  for (const [index, slot] of slots.entries()) {
    if (!include(slot) || slot.picked === null) continue
    if (slot.readiness === undefined || slot.readiness >= 100) continue
    if (weakest === null || slot.readiness < weakest.readiness) {
      weakest = { index, readiness: slot.readiness }
    }
  }
  return weakest?.index ?? null
}

/**
 * Where to invest next in one lineup, read off its resolved slots: every empty slot (nothing owned
 * fits), and the filled slot furthest below the boss step's target, preferring essential slots since
 * they weigh twice in team readiness. Ties keep the earlier slot.
 */
export function resolveGuildRaidLineupFocus(
  slots: readonly GuildRaidFocusSlot[]
): GuildRaidLineupFocus {
  const emptySlotIndexes = slots.flatMap((slot, index) =>
    slot.picked === null ? [index] : []
  )

  return {
    emptySlotIndexes,
    weakestSlotIndex:
      weakestIndex(slots, (slot) => slot.essential) ??
      weakestIndex(slots, () => true),
  }
}
