import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setTestAuth } from "@/test/auth"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import type { LegendaryEventPlan } from "./plan.types"
import { usePlanWriteQueue } from "./use-plan-write-queue"

beforeEach(() => setTestAuth({ authenticated: true }))
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}))

const EVENT = "votanUthar"

const plan = (
  revision: number,
  fields: Partial<LegendaryEventPlan> = {}
): LegendaryEventPlan => ({
  eventId: EVENT,
  revision,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  teams: [],
  runs: [],
  annotations: [],
  ...fields,
})

describe("usePlanWriteQueue", () => {
  it("serialises writes from different sections of one event, each on the previous returned revision", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    const queryKey = legendaryEventPlanQueries.detail(EVENT).queryKey
    queryClient.setQueryData(queryKey, plan(2))
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    // Two hook instances, as the run inputs drawer and the marks grid hold them.
    const runs = renderHook(() => usePlanWriteQueue(EVENT), { wrapper })
    const marks = renderHook(() => usePlanWriteQueue(EVENT), { wrapper })

    let releaseFirst!: (value: LegendaryEventPlan) => void
    const firstSend = vi.fn(
      () => new Promise<LegendaryEventPlan>((done) => (releaseFirst = done))
    )
    const secondSend = vi.fn(async (base: LegendaryEventPlan) =>
      plan(base.revision + 1, { notes: "second" })
    )

    let first!: Promise<string>
    let second!: Promise<string>
    act(() => {
      first = runs.result.current.enqueue({
        patch: (current) => ({ ...current, showPaidOptions: true }),
        send: firstSend,
      })
      second = marks.result.current.enqueue({
        patch: (current) => ({ ...current, notes: "second" }),
        send: secondSend,
      })
    })

    // Both show at once; the second request waits for the first.
    expect(queryClient.getQueryData<LegendaryEventPlan>(queryKey)).toEqual(
      expect.objectContaining({ showPaidOptions: true, notes: "second" })
    )
    expect(runs.result.current.pending).toBe(true)
    expect(marks.result.current.pending).toBe(true)
    await act(async () => {})
    expect(firstSend).toHaveBeenCalledTimes(1)
    expect(secondSend).not.toHaveBeenCalled()

    await act(async () => {
      releaseFirst(plan(3, { showPaidOptions: true }))
      await Promise.all([first, second])
    })

    expect(secondSend).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 3 })
    )
    expect(queryClient.getQueryData<LegendaryEventPlan>(queryKey)).toEqual(
      plan(4, { notes: "second" })
    )
    expect(marks.result.current.pending).toBe(false)
  })

  it("refreshes the plan list after a saved write", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    queryClient.setQueryData(
      legendaryEventPlanQueries.detail(EVENT).queryKey,
      plan(2)
    )
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const queue = renderHook(() => usePlanWriteQueue(EVENT), { wrapper })
    await act(async () => {
      await queue.result.current.enqueue({ send: async () => plan(3) })
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: legendaryEventPlanQueries.list().queryKey,
      exact: true,
    })
  })
})
