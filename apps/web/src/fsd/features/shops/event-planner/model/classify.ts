import type { GameCatalogEventShop } from "@workspace/game-catalog"

import type { EventShopCartEntry } from "@/entities/event-shop"

import { resolveEntry, type ResolvedEntry } from "./entry"

type EntryState = "done" | "needsReview" | "upcoming"

/**
 * One cart entry split by time and purchase (spec event-shop-shopping-list): its bought packs, and the
 * rest — to buy on today or later, missed on a past day. The single classification every list group,
 * total, day state and coverage supply derives from.
 */
export interface ClassifiedEntry extends ResolvedEntry {
  boughtPacks: number
  toBuyPacks: number
  missedPacks: number
  state: EntryState
  /** Bought packs on a day after today (marked bought before the offer is on sale). */
  boughtAhead: boolean
}

function classifyEntry(
  resolved: ResolvedEntry,
  todayIndex: number
): ClassifiedEntry {
  const { quantity, purchasedQuantity } = resolved.entry
  const past = resolved.dayIndex < todayIndex
  const rest = quantity - purchasedQuantity
  const done = rest <= 0
  return {
    ...resolved,
    boughtPacks: purchasedQuantity,
    toBuyPacks: past ? 0 : Math.max(0, rest),
    missedPacks: past ? Math.max(0, rest) : 0,
    state: done ? "done" : past ? "needsReview" : "upcoming",
    boughtAhead: purchasedQuantity > 0 && resolved.dayIndex > todayIndex,
  }
}

export interface ClassifiedCart {
  /** Resolvable entries, in event-day then slot order. */
  entries: ClassifiedEntry[]
  /** Entries the catalog no longer has (missing week, day, slot or reward). */
  unresolvable: EventShopCartEntry[]
}

/** Every entry classified against `todayIndex` (the event day index of now; may be outside the event). */
export function classifyCart(
  event: GameCatalogEventShop,
  entries: readonly EventShopCartEntry[],
  todayIndex: number
): ClassifiedCart {
  const classified: ClassifiedEntry[] = []
  const unresolvable: EventShopCartEntry[] = []
  for (const entry of entries) {
    const resolved = resolveEntry(event, entry)
    if (resolved) classified.push(classifyEntry(resolved, todayIndex))
    else unresolvable.push(entry)
  }
  classified.sort(
    (a, b) => a.dayIndex - b.dayIndex || a.entry.slotIndex - b.entry.slotIndex
  )
  return { entries: classified, unresolvable }
}
