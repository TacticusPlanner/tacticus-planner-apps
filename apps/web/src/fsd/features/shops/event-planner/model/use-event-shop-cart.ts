import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { GameCatalogEventShop } from "@workspace/game-catalog"

import {
  eventShopPlanConflict,
  eventShopPlanQueries,
  useEventShopPlan,
  useSaveEventShopPlan,
} from "@/entities/shops/event-plan"
import type { EventShopCartEntry } from "@/entities/shops/event-plan"

import { dropUnresolvable } from "./cart"

/** How long edits wait before they are saved, so a burst of taps is one PUT. */
export const CART_SAVE_DEBOUNCE_MS = 400

type CartNotice =
  /** A save met a newer plan (409): the cart now shows it and the local edit is gone. */
  | { kind: "reloaded" }
  /** Entries the catalog no longer has were dropped before saving. */
  | { kind: "removed"; count: number }

export type EventShopCartState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      entries: readonly EventShopCartEntry[]
      /** Applies a pure cart operation (see `cart.ts`); the UI updates at once and the cart saves. */
      apply: (
        operation: (cart: readonly EventShopCartEntry[]) => EventShopCartEntry[]
      ) => void
      saving: boolean
      /** The last save failed for a reason other than a conflict; edits are kept and retried. */
      saveFailed: boolean
      retrySave: () => void
      notice: CartNotice | null
      dismissNotice: () => void
    }

/**
 * The event's cart as the UI edits it (spec event-shop-planner: cart and purchase tracking): optimistic
 * local entries over the stored plan, saved as the whole entry set after `CART_SAVE_DEBOUNCE_MS`, with
 * at most one PUT in flight (the latest edits are sent when it settles). A 409 replaces the cart with
 * the plan from the response and drops the pending edit.
 */
export function useEventShopCart(
  event: GameCatalogEventShop
): EventShopCartState {
  const client = useQueryClient()
  const plan = useEventShopPlan(event.id)
  const save = useSaveEventShopPlan(event.id)
  const [local, setLocal] = useState<readonly EventShopCartEntry[] | null>(null)
  const [notice, setNotice] = useState<CartNotice | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  // The newest unsaved edit and the revision it is based on; a timer and an in-flight flag keep one PUT
  // at a time.
  const pending = useRef<readonly EventShopCartEntry[] | null>(null)
  const revision = useRef(0)
  const inFlight = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (plan.data && !inFlight.current && pending.current === null) {
      revision.current = plan.data.revision
    }
  }, [plan.data])

  const flush = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    // Edits made while a save was in flight go next; after a failure, their own timer (or
    // `retrySave`) sends them, so a lasting failure doesn't loop.
    let failed = false
    while (!failed && pending.current !== null) {
      const { cart, removed } = dropUnresolvable(event, pending.current)
      pending.current = null
      if (removed > 0) {
        setNotice({ kind: "removed", count: removed })
        setLocal(cart)
      }
      try {
        const saved = await save.mutateAsync({
          expectedRevision: revision.current,
          entries: cart,
        })
        revision.current = saved.revision
        setSaveFailed(false)
        if (!hasPendingEdit(pending)) setLocal(null)
      } catch (error) {
        const conflict = eventShopPlanConflict(error)
        if (conflict) {
          client.setQueryData(
            eventShopPlanQueries.detail(event.id).queryKey,
            conflict.current
          )
          revision.current = conflict.current.revision
          pending.current = null
          setLocal(null)
          setNotice({ kind: "reloaded" })
        } else {
          requeue(pending, cart)
          failed = true
          setSaveFailed(true)
        }
      }
    }
    inFlight.current = false
    setSaving(false)
  }, [client, event, save])

  const schedule = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      void flush()
    }, CART_SAVE_DEBOUNCE_MS)
  }, [flush])

  // Leaving the page or switching event (the page remounts per event) with an unsaved edit still saves
  // it instead of dropping it: inside the debounce, and also after a failed save left it pending with no
  // timer (a save already in flight sends it when it settles).
  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  }, [flush])
  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
      if (pending.current !== null) void flushRef.current()
    },
    []
  )

  const entries = local ?? plan.data?.entries

  const apply = useCallback(
    (
      operation: (cart: readonly EventShopCartEntry[]) => EventShopCartEntry[]
    ) => {
      const next = operation(
        pending.current ?? local ?? plan.data?.entries ?? []
      )
      pending.current = next
      setLocal(next)
      schedule()
    },
    [local, plan.data, schedule]
  )

  if (plan.isError) return { status: "error", retry: () => void plan.refetch() }
  if (!entries) return { status: "loading" }
  return {
    status: "ready",
    entries,
    apply,
    saving,
    saveFailed,
    retrySave: () => {
      requeue(pending, entries)
      void flush()
    },
    notice,
    dismissNotice: () => setNotice(null),
  }
}

/** Whether an edit waits to be saved. A call, so the check after an `await` isn't narrowed away:
 *  `apply` can queue an edit while a save is in flight. */
function hasPendingEdit(pending: {
  current: readonly EventShopCartEntry[] | null
}): boolean {
  return pending.current !== null
}

/** Queues `entries` to save unless a newer edit is already waiting. */
function requeue(
  pending: { current: readonly EventShopCartEntry[] | null },
  entries: readonly EventShopCartEntry[]
) {
  if (pending.current === null) pending.current = entries
}
