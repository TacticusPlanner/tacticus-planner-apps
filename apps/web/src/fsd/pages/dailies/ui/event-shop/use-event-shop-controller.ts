import { useCallback, useMemo, useState } from "react"
import {
  eventDay,
  eventDayIndex,
  eventStatus,
  resolveEventDaySlots,
  type EventShopDay,
  type EventShopStatus,
  type GameCatalogEventShop,
  type ResolvedEventSlot,
  type ResolvedShopOffer,
} from "@workspace/game-catalog"

import type { DraftAlliance, EventShopCartEntry } from "@/entities/event-shop"
import {
  addOffer,
  buildDayStates,
  dailyFreebie,
  buildShoppingList,
  classifyCart,
  clearWeek,
  dropUnbought,
  entryKey,
  markAllBought,
  markDayBought,
  removeEntry,
  setBought,
  setDraftAlliance,
  setQuantity,
  undoBought,
  useEventShopCart,
  useRosterShopContext,
  type ClassifiedEntry,
  type DayState,
  type EventShopCartState,
  type RosterShopContext,
  type ShoppingList,
} from "@/features/shops/event-planner"

type EntryRef = Pick<EventShopCartEntry, "week" | "day" | "slotIndex">

/** A dialog the page shows over the shop. */
export type EventShopDialog =
  | {
      kind: "alliance"
      ref: EntryRef
      rewardType: string
      change: boolean
      /** Packs to plan once the alliance is chosen; the day's max when absent. */
      quantity?: number
      /** The slot plans another reward that day and the user confirmed replacing it. */
      replace?: boolean
    }
  | {
      kind: "replace"
      ref: EntryRef
      rewardType: string
      draftAlliance: DraftAlliance | null
      current: EventShopCartEntry
      quantity?: number
    }
  | { kind: "boughtSome"; entry: ClassifiedEntry }
  | { kind: "clearWeek"; week: number }

export interface EventShopController {
  event: GameCatalogEventShop
  now: number
  status: EventShopStatus
  /** Today's event day; negative before the event, ≥ dayCount after it. */
  todayIndex: number
  selectedDay: EventShopDay
  slots: ResolvedEventSlot[]
  roster: RosterShopContext
  cart: EventShopCartState
  /** Cart controls work only once the plan has loaded. */
  cartReady: boolean
  entries: readonly ClassifiedEntry[]
  entryByKey: ReadonlyMap<string, ClassifiedEntry>
  list: ShoppingList
  dayStates: DayState[]
  dialog: EventShopDialog | null
  closeDialog: () => void
  openDialog: (dialog: EventShopDialog) => void
  /** Adds an offer, asking for an alliance (draft) or a replace confirmation first when needed. */
  /** `quantity` defaults to the day's max (adding plans the max). */
  add: (ref: EntryRef, offer: ResolvedShopOffer, quantity?: number) => void
  /** Completes a dialog's add (alliance chosen, or replace confirmed). */
  confirmAdd: (
    ref: EntryRef,
    rewardType: string,
    draftAlliance: DraftAlliance | null,
    replace: boolean,
    quantity?: number
  ) => void
  setQuantity: (ref: EntryRef, quantity: number, cap: number) => void
  markBought: (ref: EntryRef) => void
  setBought: (ref: EntryRef, bought: number) => void
  undoBought: (ref: EntryRef) => void
  remove: (ref: EntryRef) => void
  missed: (ref: EntryRef) => void
  setAlliance: (ref: EntryRef, alliance: DraftAlliance) => void
  markTodayBought: () => void
  /** Needs review "Mark the rest missed": every past entry keeps only its bought packs. */
  missAllReview: () => void
  clearWeek: (week: number) => void
}

/**
 * Everything one event's page shows and does: the selected day's slots for the roster, the cart (one
 * classification feeding the shopping list and day states), and the cart actions with their dialogs.
 */
export function useEventShopController(
  event: GameCatalogEventShop,
  dayIndex: number | null,
  now: number
): EventShopController {
  const roster = useRosterShopContext()
  const cart = useEventShopCart(event)
  const [dialog, setDialog] = useState<EventShopDialog | null>(null)
  const todayIndex = eventDayIndex(event, now)
  const status = eventStatus(event, now)
  const selected =
    dayIndex ?? Math.min(Math.max(todayIndex, 0), event.dayCount - 1)
  const selectedDay = eventDay(event, selected)

  const lockContext = roster.lockContext ?? undefined
  const powerLevel = roster.powerLevel
  const slots = useMemo(
    () =>
      resolveEventDaySlots(event, selected, { lockContext, powerLevel, now }),
    [event, selected, lockContext, powerLevel, now]
  )

  const rawEntries = cart.status === "ready" ? cart.entries : NO_ENTRIES
  const classified = useMemo(
    () => classifyCart(event, rawEntries, todayIndex),
    [event, rawEntries, todayIndex]
  )
  const list = useMemo(
    () => buildShoppingList(classified.entries, todayIndex, event.dayCount),
    [classified.entries, todayIndex, event.dayCount]
  )
  const dayStates = useMemo(
    () => buildDayStates(classified.entries, event.dayCount),
    [classified.entries, event.dayCount]
  )
  const entryByKey = useMemo(
    () =>
      new Map(
        classified.entries.map((entry) => [entryKey(entry.entry), entry])
      ),
    [classified.entries]
  )

  const apply = cart.status === "ready" ? cart.apply : null
  const run = useCallback(
    (
      operation: (cart: readonly EventShopCartEntry[]) => EventShopCartEntry[]
    ) => apply?.(operation),
    [apply]
  )

  const confirmAdd = useCallback(
    (
      ref: EntryRef,
      rewardType: string,
      draftAlliance: DraftAlliance | null,
      replace: boolean,
      quantity?: number
    ) => {
      setDialog(null)
      // Adding plans the day's max: most players buy every pack they can.
      const max =
        slots
          .find((slot) => slot.slotIndex === ref.slotIndex)
          ?.offers.find((offer) => offer.rewardType === rewardType)
          ?.maxPerDay ?? 1
      run((current) => {
        const result = addOffer(
          current,
          {
            ...ref,
            rewardType,
            draftAlliance,
            quantity: Math.min(quantity ?? max, max),
          },
          { replace }
        )
        return result.status === "added" ? result.cart : [...current]
      })
    },
    [run, slots]
  )

  const add = useCallback(
    (ref: EntryRef, offer: ResolvedShopOffer, quantity?: number) => {
      if (cart.status !== "ready") return
      // The daily freebie is claimed in game, never planned.
      const slot = slots.find(
        (candidate) => candidate.slotIndex === ref.slotIndex
      )
      if (slot && dailyFreebie(event, slot, offer.rewardType)) return
      const probe = addOffer(cart.entries, {
        ...ref,
        rewardType: offer.rewardType,
      })
      if (probe.status === "confirmReplace") {
        setDialog({
          kind: "replace",
          ref,
          rewardType: offer.rewardType,
          draftAlliance: null,
          current: probe.current,
          quantity,
        })
        return
      }
      if (offer.rewardType.startsWith("draft_")) {
        setDialog({
          kind: "alliance",
          ref,
          rewardType: offer.rewardType,
          change: false,
          quantity,
        })
        return
      }
      confirmAdd(ref, offer.rewardType, null, false, quantity)
    },
    [cart, confirmAdd, event, slots]
  )

  return {
    event,
    now,
    status,
    todayIndex,
    selectedDay,
    slots,
    roster,
    cart,
    cartReady: cart.status === "ready",
    entries: classified.entries,
    entryByKey,
    list,
    dayStates,
    dialog,
    closeDialog: () => setDialog(null),
    openDialog: setDialog,
    add,
    confirmAdd,
    setQuantity: (ref, quantity, cap) =>
      run((current) => setQuantity(current, ref, quantity, cap)),
    markBought: (ref) => run((current) => markAllBought(current, ref)),
    setBought: (ref, bought) =>
      run((current) => setBought(current, ref, bought)),
    undoBought: (ref) => run((current) => undoBought(current, ref)),
    remove: (ref) => run((current) => removeEntry(current, ref)),
    missed: (ref) => run((current) => dropUnbought(current, ref)),
    setAlliance: (ref, alliance) =>
      run((current) => setDraftAlliance(current, ref, alliance)),
    missAllReview: () =>
      run((current) =>
        list.needsReview.reduce(
          (cart, entry) => dropUnbought(cart, entry.entry),
          [...current]
        )
      ),
    markTodayBought: () =>
      run((current) => markDayBought(event, current, todayIndex)),
    clearWeek: (week) => {
      setDialog(null)
      run((current) => clearWeek(current, week))
    },
  }
}

const NO_ENTRIES: readonly EventShopCartEntry[] = []
