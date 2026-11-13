import type {
  GameCatalogEventShop,
  GameCatalogShopVariant,
} from "../record-types"
import type { ShopDayOfWeek } from "../schemas/shops"
import { groupVariantsByRewardType } from "./shop-offers"
import {
  DOW_MAP,
  resolveEventLockId,
  type ResolvedShopOffer,
  type ShopLockContext,
} from "./shop-resolve"

// Event-shop day helpers: map a seasonal event and an instant to event days (UTC days, matching the
// 00:00 UTC shop rotation), and resolve one day's slots through the shop resolver. Pure; time is
// always injected. See specs/game-event-shops-catalog.

const DAY_MS = 86_400_000

export type EventShopStatus = "upcoming" | "running" | "ended"

/** One day of an event: 0-based index, 1-based week, its UTC calendar date and day-of-week token. */
export interface EventShopDay {
  index: number
  week: number
  /** `YYYY-MM-DD` (UTC). */
  date: string
  dow: ShopDayOfWeek
}

type EventTiming = Pick<GameCatalogEventShop, "startUtc" | "dayCount">

/** `floor((now − startUtc) / 1 day)`; negative before the event, ≥ `dayCount` after it. */
export function eventDayIndex(event: EventTiming, now: number): number {
  return Math.floor((now - Date.parse(event.startUtc)) / DAY_MS)
}

export function eventStatus(event: EventTiming, now: number): EventShopStatus {
  const index = eventDayIndex(event, now)
  if (index < 0) return "upcoming"
  return index < event.dayCount ? "running" : "ended"
}

/** The day at `index` (0..dayCount − 1): its week (`floor(index / 7) + 1`), UTC date and weekday. */
export function eventDay(event: EventTiming, index: number): EventShopDay {
  const start = new Date(Date.parse(event.startUtc) + index * DAY_MS)
  return {
    index,
    week: Math.floor(index / 7) + 1,
    date: start.toISOString().slice(0, 10),
    dow: DOW_MAP[start.getUTCDay()]!,
  }
}

/** Every day of the event, in order. */
export function eventDays(event: EventTiming): EventShopDay[] {
  return Array.from({ length: event.dayCount }, (_, index) =>
    eventDay(event, index)
  )
}

/** Today while running, day 0 before the event, the last day after it. */
export function defaultEventDay(event: EventTiming, now: number): number {
  const index = eventDayIndex(event, now)
  if (index < 0) return 0
  return Math.min(index, event.dayCount - 1)
}

/** One slot of an event day: its index in the week's `slots`, the grouped offers, and the raw variants
 *  that matched (for tier / unit-progress labels). */
export interface ResolvedEventSlot {
  slotIndex: number
  offers: ResolvedShopOffer[]
  variants: GameCatalogShopVariant[]
}

export interface ResolveEventDaySlotsOptions {
  /** Omit without synced player data: power-level bounds are then not applied. */
  powerLevel?: number
  /** Omit without synced player data: locks are then not applied, so a slot lists every option it may
   *  show. With a context, locks resolve as the permissive shop resolver does. */
  lockContext?: ShopLockContext
  now?: number
}

/**
 * The slots sold on event day `dayIndex`, in slot order, each with the offers the player gets (one
 * per slot once roster and tier resolve its locks; every option without a lock context). Slots with
 * nothing sold that day are left out, but each result keeps its original `slotIndex`.
 */
export function resolveEventDaySlots(
  event: GameCatalogEventShop,
  dayIndex: number,
  {
    powerLevel,
    lockContext,
    now = Date.now(),
  }: ResolveEventDaySlotsOptions = {}
): ResolvedEventSlot[] {
  const day = eventDay(event, dayIndex)
  const week = event.weeks[day.week - 1]
  if (!week) return []

  const matches = (variant: GameCatalogShopVariant) =>
    variant.days.includes(day.dow) &&
    (powerLevel === undefined ||
      ((variant.minPowerLevel === undefined ||
        powerLevel >= variant.minPowerLevel) &&
        (variant.maxPowerLevel === undefined ||
          powerLevel <= variant.maxPowerLevel))) &&
    (lockContext === undefined ||
      resolveEventLockId(variant.lockId, lockContext, now))

  return week.slots.flatMap((slot, slotIndex) => {
    const variants = slot.variants.filter(matches)
    return variants.length === 0
      ? []
      : [{ slotIndex, offers: groupVariantsByRewardType(variants), variants }]
  })
}
