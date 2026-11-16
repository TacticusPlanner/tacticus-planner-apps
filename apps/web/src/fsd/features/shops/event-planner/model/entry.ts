import { eventDays } from "@workspace/game-catalog"
import type {
  GameCatalogEventShop,
  ResolvedEventSlot,
} from "@workspace/game-catalog"

import type { EventShopCartEntry } from "@/entities/shops/event-plan"

/** A cart entry joined with its catalog offer: the price and pack size of one pack, the per-day cap. */
export interface ResolvedEntry {
  entry: EventShopCartEntry
  /** 0-based event day of the entry. */
  dayIndex: number
  costPerPack: number
  qtyPerPack: number
  cap: number
}

/** `week/day/slot`: at most one cart entry per slot per day. */
export function entryKey(
  entry: Pick<EventShopCartEntry, "week" | "day" | "slotIndex">
): string {
  return `${entry.week}/${entry.day}/${entry.slotIndex}`
}

/** The 0-based event day of `week`'s `day`, or -1 when the event has no such day. */
export function dayIndexOf(
  event: Pick<GameCatalogEventShop, "startUtc" | "dayCount">,
  week: number,
  day: EventShopCartEntry["day"]
): number {
  return (
    eventDays(event).find((candidate) => {
      return candidate.week === week && candidate.dow === day
    })?.index ?? -1
  )
}

/**
 * The entry's offer in the catalog: the variants of its week's slot sold on its day with its reward
 * type. `null` when the catalog no longer has it.
 *
 * The cap is the player's: with `slotsByDay` (each event day's slots resolved for the roster's power level
 * and locks, as the add path uses), it is that day's resolved offer's `maxPerDay`, so the slider can't
 * plan more than the player can buy. Without it, or when the player's slot no longer resolves to this
 * reward, it falls back to the largest cap of any variant (what the API accepts).
 */
export function resolveEntry(
  event: GameCatalogEventShop,
  entry: EventShopCartEntry,
  slotsByDay?: readonly (readonly ResolvedEventSlot[])[]
): ResolvedEntry | null {
  const dayIndex = dayIndexOf(event, entry.week, entry.day)
  const variants =
    dayIndex < 0
      ? []
      : (
          event.weeks[entry.week - 1]?.slots[entry.slotIndex]?.variants ?? []
        ).filter(
          (variant) =>
            variant.reward.type === entry.rewardType &&
            variant.days.includes(entry.day)
        )
  const first = variants[0]
  if (!first) return null
  const playerCap = slotsByDay?.[dayIndex]
    ?.find((slot) => slot.slotIndex === entry.slotIndex)
    ?.offers.find((offer) => offer.rewardType === entry.rewardType)?.maxPerDay
  return {
    entry,
    dayIndex,
    costPerPack: first.cost.amount,
    qtyPerPack: first.reward.qty,
    cap:
      playerCap ??
      Math.max(...variants.map((variant) => variant.maxPurchasesPerDay)),
  }
}
