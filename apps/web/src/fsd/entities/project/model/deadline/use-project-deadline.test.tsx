import { renderHook, waitFor } from "@/test/render"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { seedGameCatalog } from "@/test/seed"

import { useProjectDeadline } from "./use-project-deadline"

const lysander = {
  id: "astarLysander",
  name: "Lysander",
  eventStageStartDatesUtc: ["2026-08-30T00:00:00Z", "2026-12-13T00:00:00Z"],
}
const project = (eventId: string | null) => ({
  projectId: "p1",
  target: eventId ? { kind: "legendaryEvent" as const, eventId } : null,
})

describe("useProjectDeadline", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-15T12:00:00Z"))
    await seedGameCatalog({ lres: [lysander] })
  })

  afterEach(() => vi.useRealTimers())

  it("is null for an untargeted project", () => {
    const { result } = renderHook(() => useProjectDeadline(project(null)))
    expect(result.current).toBeNull()
  })

  it("is loading, then ready at the next run's start", async () => {
    const { result } = renderHook(() =>
      useProjectDeadline(project("astarLysander"))
    )
    expect(result.current).toEqual({ status: "loading" })
    await waitFor(() =>
      expect(result.current).toEqual({
        status: "ready",
        deadlineMs: Date.parse("2026-12-13T00:00:00Z"),
        endMs: Date.parse("2026-12-20T00:00:00Z"),
        run: 2,
        estimated: false,
        ended: false,
      })
    )
  })

  it("is unavailable for an event the catalog does not serve", async () => {
    const { result } = renderHook(() => useProjectDeadline(project("gone")))
    await waitFor(() =>
      expect(result.current).toEqual({ status: "unavailable" })
    )
  })
})
