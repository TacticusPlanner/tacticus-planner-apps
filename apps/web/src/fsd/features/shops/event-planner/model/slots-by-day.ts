import { resolveEventDaySlots } from "@workspace/game-catalog"
import type {
  GameCatalogEventShop,
  ResolvedEventSlot,
  ResolveEventDaySlotsOptions,
} from "@workspace/game-catalog"

import { withoutFreebies } from "./freebie"

/**
 * Every event day's purchasable slots, resolved once for the roster's power level and locks with the daily
 * freebie left out. The slots don't depend on the cart, so the page computes this once per event and
 * roster and hands it to the player caps, Coverage, search and the slot sheet instead of each resolving
 * every day again.
 */
export function purchasableSlotsByDay(
  event: GameCatalogEventShop,
  options: ResolveEventDaySlotsOptions
): ResolvedEventSlot[][] {
  return Array.from({ length: event.dayCount }, (_, dayIndex) =>
    withoutFreebies(event, resolveEventDaySlots(event, dayIndex, options))
  )
}
