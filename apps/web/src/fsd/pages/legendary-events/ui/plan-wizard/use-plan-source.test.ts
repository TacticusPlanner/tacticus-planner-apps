import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ClearEstimateConfig } from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { setTestAuth } from "@/test/auth"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import { EMPTY_PLAN } from "./plan.fixtures"
import { usePlanSource } from "./use-plan-source"

const CONFIG: ClearEstimateConfig = {
  powerRatio: 1.2,
  calibrated: true,
  hordeMultipliers: new Map(),
  unitPower: unitPowerContextFixture(),
}
const CONFIG_STATE = { status: "ready", config: CONFIG }
let configState: unknown = CONFIG_STATE
let eventData: unknown = utharEvent
const PLAN_QUERY = { query: { status: "success", data: EMPTY_PLAN } }
const EVENTS = [utharEvent]
const ROSTER: never[] = []
const BATTLES: never[] = []
const PROGRESS = { currentEventRun: 2 }
let progress: unknown = PROGRESS
let roster: unknown = ROSTER
const SYNC_TIMES = { progressObservedAtMs: null }
const FAILED_GOALS = { status: "failed" }

// Like the real reads, every render hands out a new state object around the same data.
const read = (data: unknown) => ({ status: "ready", data, retry: vi.fn() })

// Stable across renders, like the real resolver (a test swaps it to check the frozen source).
let unitName = () => ""
vi.mock("@/shared/unit-name", () => ({ useUnitName: () => unitName }))
vi.mock("@/shared/unit-power", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/unit-power")>()),
  useUnitPowerContext: () => ({}),
}))
vi.mock("@/features/legendary-event-goals", () => ({
  useLegendaryEventGoalTargets: () => FAILED_GOALS,
}))
vi.mock("@/entities/npc", () => ({
  useNpcsById: () => ({ status: "loading" }),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  useLegendaryEvent: () => ({
    status: "ready",
    data: eventData,
    retry: vi.fn(),
    nowMs: 0,
    // Re-derived every render, as the minute tick does.
    lifecycle: { state: "active", runStartMs: 1, runEndMs: 2 },
    catalogSynced: true,
  }),
  useLegendaryEvents: () => read(EVENTS),
  useLegendaryEventProgress: () => read(progress),
  useLegendaryEventUnits: () => read(legendaryEventCharacters),
  useLegendaryEventRoster: () => read(roster),
  useLegendaryEventBattles: () => read(BATTLES),
  useLegendaryEventSyncTimes: () => read(SYNC_TIMES),
  useClearEstimateConfig: () => configState,
  usePlanWriteQueue: () => PLAN_QUERY,
}))

describe("usePlanSource", () => {
  beforeEach(() => {
    setTestAuth({ authenticated: true })
    progress = PROGRESS
    roster = ROSTER
    unitName = () => ""
    configState = CONFIG_STATE
    eventData = utharEvent
  })

  it("is ready for an event with no synced progress or roster", () => {
    // An upcoming event (Lost a Bile) has no progress record: the read is ready with no data.
    progress = undefined
    roster = undefined
    const { result } = renderHook(() => usePlanSource(utharEvent.id))
    expect(result.current.status).toBe("ready")
  })

  it("keeps the same inputs and goal targets across renders", () => {
    // A failed goal read still plans, without reusing goals.
    const { result, rerender } = renderHook(() => usePlanSource(utharEvent.id))
    const first = result.current
    expect(first.status).toBe("ready")
    rerender()
    const second = result.current
    if (first.status !== "ready" || second.status !== "ready") {
      throw new Error("not ready")
    }
    expect(second.inputs).toBe(first.inputs)
    expect(second.goalTargets).toBe(first.goalTargets)
    expect(second.goalTargets.size).toBe(0)
  })
  it("keeps its first ready value when a read refetches or the unit names change", () => {
    const { result, rerender } = renderHook(() => usePlanSource(utharEvent.id))
    const first = result.current
    // A refetch hands out new arrays around the same data; a language switch, a new resolver.
    roster = []
    progress = { ...PROGRESS }
    unitName = () => "renamed"
    rerender()
    expect(result.current).toBe(first)
  })
  it("says there is nothing to reach when the event has no reward ladder", () => {
    eventData = { ...utharEvent, rewards: undefined }
    const { result } = renderHook(() => usePlanSource(utharEvent.id))
    expect(result.current).toMatchObject({
      status: "nothingToReach",
      reason: "noLadder",
    })
  })

  it("names unit power as missing when clear estimates are unavailable", () => {
    configState = { status: "ready", config: { ...CONFIG, unitPower: null } }
    const { result } = renderHook(() => usePlanSource(utharEvent.id))
    expect(result.current).toMatchObject({
      status: "noEstimates",
      missing: ["unitPower"],
    })
  })
})
