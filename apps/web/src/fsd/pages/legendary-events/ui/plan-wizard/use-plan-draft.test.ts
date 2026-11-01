import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import { planWrites } from "./plan-create"
import { EMPTY_PLAN, RUN_3_START_MS, planInputs } from "./plan.fixtures"
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

describe("usePlanDraft team edits", () => {
  const stored = {
    id: "melee",
    laneId: "alpha" as const,
    name: "Melee",
    sortOrder: 0,
    memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
    reserveUnitId: null,
    objectiveIndexes: [0],
    runDepths: [],
  }
  const source = {
    ...SOURCE,
    inputs: planInputs({ plan: { ...EMPTY_PLAN, teams: [stored] } }),
  }
  const writesOf = (draft: ReturnType<typeof usePlanDraft>) =>
    planWrites({
      plan: draft.inputs.plan,
      teams: draft.evaluation.teams,
      chains: draft.chains,
      runs: draft.runs,
      economy: draft.economy,
    })

  it("turns an edited stored team into one update, not a removal and a creation", () => {
    const { result } = renderHook(() => usePlanDraft(source, null))
    const team = result.current.evaluation.teams.find(
      (entry) => entry.storedId === "melee"
    )!
    act(() =>
      result.current.editTeam(team, {
        name: "Melee",
        memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraTigurius"],
        reserveUnitId: null,
        objectiveIndexes: [0],
      })
    )
    const alpha = writesOf(result.current).lanes.find(
      (lane) => lane.laneId === "alpha"
    )!
    expect(alpha.remove).toEqual([])
    expect(alpha.update.map((entry) => entry.storedId)).toEqual(["melee"])
    expect(alpha.update[0]!.memberUnitIds).toContain("ultraTigurius")
  })

  it("uses the depth set in the editor on every plan run and sends it with the update", () => {
    const { result } = renderHook(() => usePlanDraft(source, null))
    const team = result.current.evaluation.teams.find(
      (entry) => entry.storedId === "melee"
    )!
    act(() =>
      result.current.editTeam(team, {
        name: team.name,
        memberUnitIds: team.memberUnitIds,
        reserveUnitId: team.reserveUnitId,
        objectiveIndexes: team.objectiveIndexes,
        depthOverride: 1,
      })
    )
    const edited = result.current.evaluation.teams.find(
      (entry) => entry.storedId === "melee"
    )!
    expect(Object.keys(edited.depthByRun).length).toBeGreaterThan(0)
    expect(Object.values(edited.depthByRun).every((depth) => depth === 1)).toBe(
      true
    )
    const alpha = writesOf(result.current).lanes.find(
      (lane) => lane.laneId === "alpha"
    )!
    expect(alpha.update[0]).toMatchObject({
      storedId: "melee",
      depthOverride: 1,
    })
  })

  it("creates an added team", () => {
    const { result } = renderHook(() => usePlanDraft(source, null))
    act(() =>
      result.current.addTeam("beta", {
        name: "Mine",
        memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
        reserveUnitId: null,
        objectiveIndexes: [],
      })
    )
    const beta = writesOf(result.current).lanes.find(
      (lane) => lane.laneId === "beta"
    )!
    expect(beta.create.some((entry) => entry.name === "Mine")).toBe(true)
  })

  it("keeps a removed team removed until its own Undo", () => {
    const { result } = renderHook(() => usePlanDraft(source, null))
    const team = result.current.evaluation.teams.find(
      (entry) => entry.storedId === "melee"
    )!
    act(() => result.current.removeTeam(team))
    expect(result.current.removedTeams.get("melee")?.name).toBe("Melee")
    expect(
      result.current.evaluation.teams.some((entry) => entry.key === "melee")
    ).toBe(false)
    act(() => result.current.undoRemove("melee"))
    expect(result.current.removedTeams.size).toBe(0)
    expect(
      result.current.evaluation.teams.some((entry) => entry.key === "melee")
    ).toBe(true)
  })
})
