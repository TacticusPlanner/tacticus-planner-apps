import { useEffect, useState } from "react"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useEventsCalendar } from "./use-events-calendar"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const catalog = vi.hoisted(() => ({
  ranges: [] as { start: Date; end: Date }[],
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getEventDefinitions: async () => [
    { id: "hse-machine-hunt", type: "HomeScreenEvent" },
  ],
  getUpcomingEvents: async (start: Date, end: Date) => {
    catalog.ranges.push({ start, end })
    return [
      {
        occurrenceId: "occ-hunt",
        definitionId: "hse-machine-hunt",
        confirmed: true,
        // Local times keep the test independent of the runner's timezone.
        startUtc: new Date(2026, 9, 13, 10).toISOString(),
        endUtc: new Date(2026, 9, 15, 10).toISOString(),
        parameters: null,
      },
    ]
  },
}))

function huntEntry(result: { current: ReturnType<typeof useEventsCalendar> }) {
  return result.current.days
    .flatMap((day) => day.entries)
    .find((entry) => entry.definitionId === "hse-machine-hunt")
}

describe("useEventsCalendar", () => {
  beforeEach(() => {
    catalog.ranges = []
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
  })
  afterEach(() => vi.useRealTimers())

  it("drops an ended event's active state on the minute tick, without a data change", async () => {
    vi.setSystemTime(new Date(2026, 9, 15, 9, 59, 30))
    const { result } = renderHook(() => useEventsCalendar())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(huntEntry(result)?.isActiveNow).toBe(true)

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(huntEntry(result)?.isActiveNow).toBe(false)
  })

  it("rolls the current week forward at local midnight while the page stays open", async () => {
    vi.setSystemTime(new Date(2026, 9, 14, 23, 59, 30))
    const { result } = renderHook(() => useEventsCalendar())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current.rangeStart).toEqual(new Date(2026, 9, 14))

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current.rangeStart).toEqual(new Date(2026, 9, 15))
    expect(result.current.rangeEnd).toEqual(new Date(2026, 9, 22))
    expect(catalog.ranges.at(-1)?.start).toEqual(new Date(2026, 9, 15))
  })

  it("keeps the same window between ticks within one day", async () => {
    vi.setSystemTime(new Date(2026, 9, 14, 12))
    const { result } = renderHook(() => useEventsCalendar())
    await act(() => vi.advanceTimersByTimeAsync(0))
    const firstStart = result.current.rangeStart
    const reads = catalog.ranges.length

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current.rangeStart).toBe(firstStart)
    expect(catalog.ranges).toHaveLength(reads)
  })
})
