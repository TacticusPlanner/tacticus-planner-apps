import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/shared/api"
import type { EventShopCartEntry, EventShopPlan } from "@/entities/event-shop"

import { markAllBought } from "./cart"
import { entry, testEvent } from "./test-event.fixture"
import { CART_SAVE_DEBOUNCE_MS, useEventShopCart } from "./use-event-shop-cart"

const mutateAsync = vi.fn()
let storedPlan: EventShopPlan

vi.mock("@/entities/event-shop", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/event-shop")>()),
  useEventShopPlan: () => ({ data: storedPlan, isError: false }),
  useSaveEventShopPlan: () => ({ mutateAsync }),
}))

const yarrick = entry("THU", 0, "shards_astraYarrick", 2, 0)
const thu = { week: 1, day: "THU", slotIndex: 0 } as const

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

const plan = (revision: number, entries: EventShopCartEntry[]) => ({
  eventId: "october-2026",
  revision,
  catalogVersion: "1",
  entries,
})

const ready = (state: ReturnType<typeof useEventShopCart>) => {
  if (state.status !== "ready") throw new Error(`not ready: ${state.status}`)
  return state
}

describe("useEventShopCart", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    storedPlan = plan(1, [yarrick])
    mutateAsync.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it("shows an edit at once and saves the whole cart once after the debounce", async () => {
    mutateAsync.mockImplementation(({ entries }) =>
      Promise.resolve(plan(2, entries))
    )
    const { result } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })

    act(() => ready(result.current).apply((cart) => markAllBought(cart, thu)))
    act(() => ready(result.current).apply((cart) => markAllBought(cart, thu)))
    expect(ready(result.current).entries[0]?.purchasedQuantity).toBe(2)
    expect(mutateAsync).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({
      expectedRevision: 1,
      entries: [{ ...yarrick, purchasedQuantity: 2 }],
    })
  })

  it("saves a pending edit at once when the cart unmounts inside the debounce", () => {
    mutateAsync.mockImplementation(({ entries }) =>
      Promise.resolve(plan(2, entries))
    )
    const { result, unmount } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })
    act(() => ready(result.current).apply((cart) => markAllBought(cart, thu)))
    unmount()
    expect(mutateAsync).toHaveBeenCalledWith({
      expectedRevision: 1,
      entries: [{ ...yarrick, purchasedQuantity: 2 }],
    })
  })

  it("keeps one save in flight and sends the latest edit after it with the new revision", async () => {
    let resolveFirst: (value: EventShopPlan) => void = () => {}
    mutateAsync
      .mockImplementationOnce(
        () => new Promise<EventShopPlan>((resolve) => (resolveFirst = resolve))
      )
      .mockImplementation(({ entries }) => Promise.resolve(plan(3, entries)))
    const { result } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })

    act(() => ready(result.current).apply((cart) => markAllBought(cart, thu)))
    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))
    act(() => ready(result.current).apply(() => []))
    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))
    expect(mutateAsync).toHaveBeenCalledTimes(1)

    await act(async () => resolveFirst(plan(2, [yarrick])))

    expect(mutateAsync).toHaveBeenCalledTimes(2)
    expect(mutateAsync).toHaveBeenLastCalledWith({
      expectedRevision: 2,
      entries: [],
    })
  })

  it("reloads the stored plan on a conflict and says so", async () => {
    const current = plan(5, [entry("SUN", 0, "shards_astraYarrick", 1)])
    mutateAsync.mockRejectedValue(
      new ApiError(409, "stale", { issueCode: "eventShopPlanStale", current })
    )
    const { result } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })

    act(() => ready(result.current).apply(() => []))
    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))

    expect(ready(result.current).notice).toEqual({ kind: "reloaded" })
  })

  it("drops entries the catalog no longer has before saving", async () => {
    mutateAsync.mockImplementation(({ entries }) =>
      Promise.resolve(plan(2, entries))
    )
    const { result } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })

    act(() =>
      ready(result.current).apply((cart) => [
        ...cart,
        entry("MON", 9, "gold", 1),
      ])
    )
    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))

    expect(mutateAsync).toHaveBeenCalledWith({
      expectedRevision: 1,
      entries: [yarrick],
    })
    expect(ready(result.current).notice).toEqual({ kind: "removed", count: 1 })
  })

  it("keeps the edit when a save fails and retries it", async () => {
    mutateAsync
      .mockRejectedValueOnce(new ApiError(500, "boom"))
      .mockImplementation(({ entries }) => Promise.resolve(plan(2, entries)))
    const { result } = renderHook(() => useEventShopCart(testEvent), {
      wrapper,
    })

    act(() => ready(result.current).apply(() => []))
    await act(() => vi.advanceTimersByTimeAsync(CART_SAVE_DEBOUNCE_MS))
    expect(ready(result.current).saveFailed).toBe(true)
    expect(ready(result.current).entries).toEqual([])

    await act(async () => ready(result.current).retrySave())

    expect(mutateAsync).toHaveBeenLastCalledWith({
      expectedRevision: 1,
      entries: [],
    })
    expect(ready(result.current).saveFailed).toBe(false)
  })
})
