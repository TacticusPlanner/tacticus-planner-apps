import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useLegendaryEvent } from "./use-legendary-event"
import { useLegendaryEvents } from "./use-legendary-events"
import { useMinuteNow } from "./use-minute-now"

// Its first run starts 90 s after the test clock: the first tick flips nothing, the second
// turns the event from upcoming to active.
const lysander = {
  id: "astarLysander",
  eventStageStartDatesUtc: ["2026-09-02T12:01:30Z"],
}
const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(60_000)
  })

describe("minute clock", () => {
  beforeEach(async () => {
    await seedGameCatalog({ lres: [lysander] })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("re-renders a raw subscriber on every tick with the new instant", async () => {
    const { result } = renderHook(() => useMinuteNow())
    const first = result.current
    await tick()
    expect(result.current).toBeGreaterThanOrEqual(first + 60_000)
  })

  it("re-renders useLegendaryEvents' host on a lifecycle flip, not on a plain tick", async () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useLegendaryEvents()
    })
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const settled = result.current
    const before = renders

    await tick()
    expect(renders).toBe(before)
    expect(result.current).toBe(settled)

    await tick()
    expect(renders).toBeGreaterThan(before)
    expect(result.current).not.toBe(settled)
    expect(result.current.nowMs).toBeGreaterThanOrEqual(
      Date.parse("2026-09-02T12:01:30Z")
    )
  })

  it("keeps useLegendaryEvents' state across an unrelated re-render", async () => {
    const { result, rerender } = renderHook(() => useLegendaryEvents())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const settled = result.current
    rerender()
    expect(result.current).toBe(settled)
  })

  it("re-renders useLegendaryEvent's host on a lifecycle flip, not on a plain tick", async () => {
    let renders = 0
    const { result, rerender } = renderHook(() => {
      renders += 1
      return useLegendaryEvent("astarLysander")
    })
    await waitFor(() =>
      expect(result.current.lifecycle?.state).toBe("upcoming")
    )
    const lifecycle = result.current.lifecycle
    rerender()
    expect(result.current.lifecycle).toBe(lifecycle)
    const before = renders

    await tick()
    expect(renders).toBe(before)

    await tick()
    expect(renders).toBeGreaterThan(before)
    expect(result.current.lifecycle?.state).toBe("active")
  })
})
