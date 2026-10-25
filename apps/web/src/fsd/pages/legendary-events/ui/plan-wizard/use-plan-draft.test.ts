import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import { RUN_3_START_MS, planInputs } from "./plan.fixtures"
import type { UpgradeRecommendation } from "./plan-upgrades"
import type { PlanSource } from "./use-plan-source"
import {
  ECONOMY_SETTLE_MS,
  isTargetSettled,
  usePlanDraft,
} from "./use-plan-draft"

// Stable across renders, like the real hook.
const FARMING = vi.hoisted(() => ({
  status: "ready",
  estimate: () => ({ days: 10, date: "2026-10-16" }),
}))
vi.mock("./use-upgrade-farming-days", () => ({
  useUpgradeFarmingDays: () => FARMING,
}))

const runSliced = vi.hoisted(() => vi.fn())
vi.mock("./run-sliced", async (importOriginal) => {
  const original = await importOriginal<typeof import("./run-sliced")>()
  runSliced.mockImplementation(original.runSliced)
  return { ...original, runSliced }
})

const generateLaneTeams = vi.hoisted(() => vi.fn())
vi.mock("./plan-teams", async (importOriginal) => {
  const original = await importOriginal<typeof import("./plan-teams")>()
  generateLaneTeams.mockImplementation(original.generateLaneTeams)
  return { ...original, generateLaneTeams }
})

const SOURCE: Extract<PlanSource, { status: "ready" }> = {
  status: "ready",
  event: utharEvent,
  inputs: planInputs(),
  runDates: {
    starts: [],
    deadlineMs: RUN_3_START_MS + 7 * 24 * 60 * 60 * 1000,
    deadlineEstimated: true,
  },
  masterTotal: () => 0,
  hordeMultiplier: () => 1,
  goalTargets: new Map(),
}

const recommendation = (ceilingAfter: number) =>
  ({ ceilingAfter }) as UpgradeRecommendation

describe("isTargetSettled", () => {
  const target = { kind: "points", points: 10_000 } as const
  const running = (ceilings: number[]) =>
    ({
      status: "running",
      recommendations: ceilings.map(recommendation),
      upgradedCeiling: ceilings.at(-1) ?? 0,
    }) as const

  it("waits while the run inputs settle, even once the search is done", () => {
    expect(
      isTargetSettled({
        settling: true,
        recommendations: { ...running([]), status: "done" },
        target,
        syncedCeiling: 12_000,
      })
    ).toBe(false)
  })

  it("settles at once when the target is reachable now", () => {
    expect(
      isTargetSettled({
        settling: false,
        recommendations: running([]),
        target,
        syncedCeiling: 10_000,
      })
    ).toBe(true)
  })

  it("settles while the search runs once a recommendation reaches the target", () => {
    const settled = (ceilings: number[]) =>
      isTargetSettled({
        settling: false,
        recommendations: running(ceilings),
        target,
        syncedCeiling: 6136,
      })
    expect(settled([8000, 9100])).toBe(false)
    expect(settled([8000, 9100, 10_450])).toBe(true)
  })

  it("settles once the search is over or unavailable", () => {
    for (const recommendations of [
      { ...running([8000]), status: "done" } as const,
      { status: "unavailable" } as const,
    ]) {
      expect(
        isTargetSettled({
          settling: false,
          recommendations,
          target,
          syncedCeiling: 6136,
        })
      ).toBe(true)
    }
  })
})

describe("usePlanDraft", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    runSliced.mockClear()
    generateLaneTeams.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("restarts the search once, 400 ms after the last of several run-input clicks", () => {
    const { result } = renderHook(() => usePlanDraft(SOURCE, null))
    const run = result.current.runs[0]!
    const starts = runSliced.mock.calls.length
    const before = result.current.planEconomy

    for (let click = 1; click <= 4; click++) {
      act(() => result.current.changeRun(run, { regularMissions: click }))
      // The field follows each click; the verdicts and the search do not yet.
      expect(result.current.runValues(run).regularMissions).toBe(click)
      expect(result.current.planEconomy).toBe(before)
      expect(result.current.settling).toBe(true)
      expect(result.current.targetSettled).toBe(false)
      act(() => {
        vi.advanceTimersByTime(150)
      })
    }
    expect(runSliced).toHaveBeenCalledTimes(starts)

    act(() => {
      vi.advanceTimersByTime(ECONOMY_SETTLE_MS - 150)
    })
    expect(result.current.settling).toBe(false)
    expect(result.current.planEconomy).toBe(result.current.economy)
    expect(runSliced).toHaveBeenCalledTimes(starts + 1)
  })

  it("does not restart the search on a re-render with unchanged inputs", () => {
    const { rerender } = renderHook(() => usePlanDraft(SOURCE, null))
    const starts = runSliced.mock.calls.length
    rerender()
    act(() => {
      vi.advanceTimersByTime(ECONOMY_SETTLE_MS)
    })
    expect(runSliced).toHaveBeenCalledTimes(starts)
  })

  it("does not regenerate lane teams when a re-render reuses the same rosters", () => {
    const { rerender } = renderHook(() => usePlanDraft(SOURCE, null))
    const generated = generateLaneTeams.mock.calls.length
    expect(generated).toBeGreaterThan(0)
    rerender()
    expect(generateLaneTeams).toHaveBeenCalledTimes(generated)
  })
})
