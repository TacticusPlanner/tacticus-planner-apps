import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setTestAuth } from "@/test/auth"

import { useLegendaryEventPlans } from "./use-legendary-event-plans"
import type { LegendaryEventRunRecord } from "./run-record.types"
import { useLegendaryEventRunRecordRosters } from "./use-legendary-event-run-record-roster"
import { useLegendaryEventRunRecords } from "./use-legendary-event-run-records"

const api = vi.hoisted(() => ({
  list: vi.fn(),
  records: vi.fn(),
  roster: vi.fn(),
}))
vi.mock("../api/legendary-event-plan.api", () => ({
  getLegendaryEventPlan: vi.fn(),
  listLegendaryEventPlans: api.list,
  getLegendaryEventRunRecords: api.records,
  getLegendaryEventRunRecordRoster: api.roster,
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
  beforeEach(() => {
    vi.clearAllMocks()
    setTestAuth({ authenticated: true })
  })

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
    await waitFor(() => expect(result.current.records.status).toBe("error"))
    let resolve!: (value: unknown) => void
    api.records.mockReturnValueOnce(new Promise((done) => (resolve = done)))
    act(() => result.current.records.retry())
    // TanStack keeps isError during the refetch; the read reports loading, not the old error.
    await waitFor(() => expect(result.current.records.status).toBe("loading"))
    await act(async () =>
      resolve({ eventId: "votanUthar", records: [], nextAfter: null })
    )
    await waitFor(() => expect(result.current.records.status).toBe("ready"))
  })

  it("keeps the same read state object across re-renders with unchanged data", async () => {
    api.records.mockResolvedValueOnce({
      eventId: "votanUthar",
      records: [],
      nextAfter: null,
    })
    const { result, rerender } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.records.status).toBe("ready"))
    const first = result.current.records
    rerender()
    expect(result.current.records).toBe(first)
  })

  it("reports a failed run-records read and retries it", async () => {
    api.records.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.records.status).toBe("error"))
    api.records.mockResolvedValueOnce({
      eventId: "votanUthar",
      records: [{ id: "r1" }],
      nextAfter: null,
    })
    act(() => result.current.records.retry())
    await waitFor(() => expect(result.current.records.status).toBe("ready"))
    expect(api.records).toHaveBeenCalledTimes(2)
  })

  it("flattens the pages loaded so far and loads the next older page on demand", async () => {
    api.records
      .mockResolvedValueOnce({
        eventId: "votanUthar",
        records: [{ id: "r3" }, { id: "r2" }],
        nextAfter: "v1|r2",
      })
      .mockResolvedValueOnce({
        eventId: "votanUthar",
        records: [{ id: "r1" }],
        nextAfter: null,
      })
    const { result } = renderHook(
      () => useLegendaryEventRunRecords("votanUthar"),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.records.status).toBe("ready"))
    expect(result.current.hasNextPage).toBe(true)
    act(() => result.current.fetchNextPage())
    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    const { records } = result.current
    expect(
      records.status === "ready" && records.data.map((record) => record.id)
    ).toEqual(["r3", "r2", "r1"])
    expect(api.records).toHaveBeenLastCalledWith(
      "votanUthar",
      expect.objectContaining({ after: "v1|r2" })
    )
  })

  it("reads a record's roster only when asked for it and only when the record has teams", async () => {
    api.roster.mockResolvedValue({ takenAt: "t", characters: [], mows: [] })
    const withTeams = { id: "r1", teams: [{ teamId: "a" }] }
    const noTeams = { id: "r2", teams: [] }
    const { result } = renderHook(
      () =>
        useLegendaryEventRunRecordRosters("votanUthar", [
          withTeams,
          noTeams,
        ] as unknown as LegendaryEventRunRecord[]),
      { wrapper: wrapper() }
    )
    expect(result.current.get("r1")?.status).toBe("loading")
    await waitFor(() => expect(result.current.get("r1")?.status).toBe("ready"))
    expect(result.current.has("r2")).toBe(false)
    expect(api.roster).toHaveBeenCalledExactlyOnceWith(
      "votanUthar",
      "r1",
      expect.anything()
    )
  })
})
