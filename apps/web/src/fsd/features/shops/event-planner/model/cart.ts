import type { GameCatalogEventShop } from "@workspace/game-catalog"

import type { DraftAlliance, EventShopCartEntry } from "@/entities/event-shop"

import { dayIndexOf, entryKey, resolveEntry } from "./entry"

// Pure cart operations: each takes the entry list and returns a new one (spec event-shop-planner:
// cart and purchase tracking; event-shop-shopping-list: Needs review, rows, Clear week). Quantities are
// clamped to the offer's cap and bought packs to the quantity, so a cart always passes the API's rules.

type Cart = readonly EventShopCartEntry[]
type EntryRef = Pick<EventShopCartEntry, "week" | "day" | "slotIndex">

const update = (
  cart: Cart,
  ref: EntryRef,
  change: (entry: EventShopCartEntry) => EventShopCartEntry | null
): EventShopCartEntry[] => {
  const key = entryKey(ref)
  return cart.flatMap((entry) => {
    if (entryKey(entry) !== key) return [entry]
    const next = change(entry)
    return next ? [next] : []
  })
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export interface OfferToAdd extends EntryRef {
  rewardType: string
  /** Packs to plan; the UI passes the day's cap (adding plans the max). Defaults to 1. */
  quantity?: number
  /** Required for a `draft_*` reward. */
  draftAlliance?: DraftAlliance | null
}

export type AddOfferResult =
  | { status: "added"; cart: EventShopCartEntry[] }
  /** The slot already plans another reward that day; add again with `replace` after the user confirms. */
  | { status: "confirmReplace"; current: EventShopCartEntry }

/** Adds an offer (`quantity` packs, 1 by default). Choosing the reward the slot already plans keeps the
 *  entry as it is. */
export function addOffer(
  cart: Cart,
  offer: OfferToAdd,
  { replace = false }: { replace?: boolean } = {}
): AddOfferResult {
  const key = entryKey(offer)
  const current = cart.find((entry) => entryKey(entry) === key)
  if (current && current.rewardType === offer.rewardType) {
    return { status: "added", cart: [...cart] }
  }
  if (current && !replace) return { status: "confirmReplace", current }
  const entry: EventShopCartEntry = {
    week: offer.week,
    day: offer.day,
    slotIndex: offer.slotIndex,
    rewardType: offer.rewardType,
    quantity: Math.max(1, offer.quantity ?? 1),
    purchasedQuantity: 0,
    draftAlliance: offer.rewardType.startsWith("draft_")
      ? (offer.draftAlliance ?? null)
      : null,
  }
  return {
    status: "added",
    cart: [...cart.filter((other) => entryKey(other) !== key), entry],
  }
}

/** Packs planned, clamped to 1..cap; bought packs never exceed it. */
export function setQuantity(
  cart: Cart,
  ref: EntryRef,
  quantity: number,
  cap: number
): EventShopCartEntry[] {
  return update(cart, ref, (entry) => {
    const next = clamp(Math.round(quantity), 1, Math.max(1, cap))
    return {
      ...entry,
      quantity: next,
      purchasedQuantity: Math.min(entry.purchasedQuantity, next),
    }
  })
}

/** "Mark N bought": every planned pack bought. */
export function markAllBought(cart: Cart, ref: EntryRef): EventShopCartEntry[] {
  return update(cart, ref, (entry) => ({
    ...entry,
    purchasedQuantity: entry.quantity,
  }))
}

/** "Bought fewer…" / "Bought some…": bought packs, clamped to 0..quantity. */
export function setBought(
  cart: Cart,
  ref: EntryRef,
  bought: number
): EventShopCartEntry[] {
  return update(cart, ref, (entry) => ({
    ...entry,
    purchasedQuantity: clamp(Math.round(bought), 0, entry.quantity),
  }))
}

/** "Not on sale until … Undo?": back to nothing bought. */
export function undoBought(cart: Cart, ref: EntryRef): EventShopCartEntry[] {
  return setBought(cart, ref, 0)
}

export function removeEntry(cart: Cart, ref: EntryRef): EventShopCartEntry[] {
  return update(cart, ref, () => null)
}

/** "Missed": drops the unbought packs — the entry keeps what was bought, and leaves the cart when that
 *  was nothing. Clear week applies the same to every entry it touches. */
export function dropUnbought(cart: Cart, ref: EntryRef): EventShopCartEntry[] {
  return update(cart, ref, (entry) =>
    entry.purchasedQuantity > 0
      ? { ...entry, quantity: entry.purchasedQuantity }
      : null
  )
}

export function setDraftAlliance(
  cart: Cart,
  ref: EntryRef,
  draftAlliance: DraftAlliance
): EventShopCartEntry[] {
  return update(cart, ref, (entry) =>
    entry.rewardType.startsWith("draft_") ? { ...entry, draftAlliance } : entry
  )
}

/** "All of today bought": every entry of the event day `todayIndex` marked bought. */
export function markDayBought(
  event: GameCatalogEventShop,
  cart: Cart,
  dayIndex: number
): EventShopCartEntry[] {
  return cart.map((entry) =>
    dayIndexOf(event, entry.week, entry.day) === dayIndex
      ? { ...entry, purchasedQuantity: entry.quantity }
      : entry
  )
}

/** Clear week: everything of `week` not bought goes (to-buy entries, and the unbought packs of Needs
 *  review entries); done entries and every bought pack stay. */
export function clearWeek(cart: Cart, week: number): EventShopCartEntry[] {
  return cart.flatMap((entry) => {
    if (entry.week !== week || entry.purchasedQuantity >= entry.quantity) {
      return [entry]
    }
    return entry.purchasedQuantity > 0
      ? [{ ...entry, quantity: entry.purchasedQuantity }]
      : []
  })
}

/** The cart without entries the catalog no longer has, and how many were removed. */
export function dropUnresolvable(
  event: GameCatalogEventShop,
  cart: Cart
): { cart: EventShopCartEntry[]; removed: number } {
  const kept = cart.filter((entry) => resolveEntry(event, entry) !== null)
  return { cart: kept, removed: cart.length - kept.length }
}
