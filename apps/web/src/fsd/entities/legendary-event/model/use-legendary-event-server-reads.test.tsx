import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLegendaryEventPlans } from "./use-legendary-event-plans"
import { useLegendaryEventRunRecords } from "./use-legendary-event-run-records"

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))

const api = vi.hoisted(() => ({
  list: vi.fn(),
  records: vi.fn(),
}))
vi.mock("../api/legendary-event-plan.api", () => ({
  getLegendaryEventPlan: vi.fn(),
  listLegendaryEventPlans: api.list,
  getLegendaryEventRunRecords: api.records,
}))

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe("server read hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("reports the plan list loading, then ready", async () => {
    let resolve!: (value: unknown) => void
    api.list.mockReturnValueOnce(new Promise((done) => (resolve = done)))
    const { result } = renderHook(() => useLegendaryEventPlans(), {
      wrapper: wrapper(),
    })
    expect(result.current.status).toBe("loading")
    await act(async () => resolve({ plans: [] }))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).toEqual([])
  })

  it("shows loading while a retry after a failure is in flight", async () => {
    api.records.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.status).toBe("error"))
    let resolve!: (value: unknown) => void
    api.records.mockReturnValueOnce(new Promise((done) => (resolve = done)))
    act(() => result.current.retry())
    // TanStack keeps isError during the refetch; the read reports loading, not the old error.
    await waitFor(() => expect(result.current.status).toBe("loading"))
    await act(async () => resolve({ eventId: "votanUthar", records: [] }))
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("keeps the same read state object across re-renders with unchanged data", async () => {
    api.records.mockResolvedValueOnce({ eventId: "votanUthar", records: [] })
    const { result, rerender } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it("reports a failed run-records read and retries it", async () => {
    api.records.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.status).toBe("error"))
    api.records.mockResolvedValueOnce({
      eventId: "votanUthar",
      records: [{ id: "r1" }],
    })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(api.records).toHaveBeenCalledTimes(2)
  })
})
