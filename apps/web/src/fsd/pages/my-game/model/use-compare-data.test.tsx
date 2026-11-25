import { describe, expect, it, vi } from "vitest"

import { renderHook, waitFor } from "@/test/render"

const record = {
  id: "record-1",
  eventId: "unplannedEvent",
  run: 1,
  startedAt: "2026-11-20T00:00:00Z",
  progressAt: "2026-11-22T00:00:00Z",
  catalogVersion: "1",
  points: 10,
}
vi.mock("@/entities/legendary-event", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/legendary-event")>()
  return {
    ...actual,
    legendaryEventPlanQueries: {
      ...actual.legendaryEventPlanQueries,
      list: () => ({
        queryKey: ["legendary-event-plans", { scope: "list" }],
        queryFn: () => Promise.resolve([]),
      }),
      latestRunRecordsAcrossEvents: () => ({
        queryKey: ["legendary-event-run-records", { scope: "allEvents" }],
        queryFn: () => Promise.resolve({ records: [record], nextAfter: null }),
      }),
    },
  }
})
vi.mock("@/entities/roster-snapshot", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/roster-snapshot")>()),
  useRosterSnapshots: () => ({
    data: { limit: 20, count: 0, autoLimit: 12, autoCount: 0, items: [] },
    isError: false,
    isFetching: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
}))

import { useCompareSources } from "./use-compare-data"

describe("useCompareSources", () => {
  it("lists a run record of an event that has no plan", async () => {
    const { result } = renderHook(() => useCompareSources(true))

    await waitFor(() => expect(result.current.status).toBe("ready"))
    const sources =
      result.current.status === "ready" ? result.current.data.sources : []
    expect(sources).toEqual([
      {
        kind: "runRecord",
        id: expect.stringContaining("record-1"),
        eventId: "unplannedEvent",
        eventName: "unplannedEvent",
        run: 1,
        takenAt: "2026-11-22T00:00:00Z",
      },
    ])
  })
})
