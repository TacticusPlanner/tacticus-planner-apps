import { describe, expect, it } from "vitest"

import {
  bestStepWithinReach,
  stepTargets,
  stepVerdict,
  type StepTarget,
} from "./plan-ceiling"
import {
  NO_TEAM_ADJUSTMENTS,
  createPlanEvaluator,
  teamSwaps,
} from "./plan-evaluator"
import { MAX_PLAN_TEAMS_PER_LANE, storedDrafts } from "./plan-teams"
import {
  chosenFrom,
  recommendUpgrades,
  recommendUpgradesNow,
} from "./plan-upgrades"
import { runSliced, type SliceClock } from "./run-sliced"
import { EMPTY_PLAN, NOW_MS, RUN_3_START_MS, planInputs } from "./plan.fixtures"
import type { LegendaryEventTeam } from "@/entities/legendary-event"

const economy = { runs: [], showPaidOptions: false }
const DAY_MS = 24 * 60 * 60 * 1000

describe("team generation", () => {
  it("fills Alpha from suggestions on the synced roster", () => {
    const { teams, ceiling } = createPlanEvaluator(
      planInputs(),
      economy
    ).evaluate([])
    const alpha = teams.filter((team) => team.laneId === "alpha")
    expect(alpha.length).toBeGreaterThan(0)
    expect(alpha.length).toBeLessThanOrEqual(MAX_PLAN_TEAMS_PER_LANE)
    expect(alpha.every((team) => team.storedId === null)).toBe(true)
    expect(alpha[0]!.depthByRun[2]).toBeGreaterThan(0)
    expect(ceiling).toBeGreaterThan(0)
  })

  it("keeps the user's teams first", () => {
    const inputs = planInputs({
      plan: {
        ...EMPTY_PLAN,
        teams: [
          {
            id: "melee",
            laneId: "alpha",
            name: "Melee",
            sortOrder: 0,
            memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
            reserveUnitId: null,
            objectiveIndexes: [0],
            runDepths: [],
          },
        ],
      },
    })
    const { teams } = createPlanEvaluator(inputs, economy).evaluate([])
    expect(teams[0]).toMatchObject({ key: "melee", storedId: "melee" })
    expect(storedDrafts(inputs, inputs.lanes[0]!, inputs.plan.teams)).toEqual([
      expect.objectContaining({ key: "melee", objectiveIndexes: [0] }),
    ])
  })

  it("gives a later run the upgraded unit's depth", () => {
    const inputs = planInputs()
    const evaluator = createPlanEvaluator(inputs, economy)
    const before = evaluator.evaluate([])
    const calgar = before.teams.find((team) =>
      team.memberUnitIds.includes("ultraCalgar")
    )!
    const after = evaluator.evaluate([
      {
        unitId: "ultraCalgar",
        step: {
          kind: "ascension",
          progression: "Legendary:RedFiveStars",
          unit: {
            ...inputs.roster[0]!,
            rank: "Diamond3",
            progressionIndex: "Legendary:RedFiveStars",
          },
        },
        readyMs: NOW_MS + 10 * DAY_MS,
      },
    ])
    const upgraded = after.teams.find((team) => team.key === calgar.key)
    expect(upgraded?.depthByRun[2]).toBe(calgar.depthByRun[2])
    expect(upgraded?.depthByRun[3]).toBeGreaterThan(calgar.depthByRun[3]!)
  })
})

const storedTeam = (
  memberUnitIds: string[],
  depth: number | null
): LegendaryEventTeam => ({
  id: "mine",
  laneId: "alpha",
  name: "Mine",
  sortOrder: 0,
  memberUnitIds,
  reserveUnitId: null,
  objectiveIndexes: [],
  runDepths:
    depth === null
      ? []
      : ([2, 3] as const).map((run) => ({
          run,
          expectedBattleClears: depth,
          expectedBattleClearsSource: "manual" as const,
          recordedAt: "",
        })),
})

const withTeam = (team: LegendaryEventTeam) =>
  planInputs({ plan: { ...EMPTY_PLAN, teams: [team] } })

describe("kept teams", () => {
  const STRONG = ["ultraCalgar", "ultraTitus", "ultraApothecary"]

  it("uses the estimate when it beats a kept team's saved depth", () => {
    const estimate = createPlanEvaluator(
      withTeam(storedTeam(STRONG, null)),
      economy
    )
      .evaluate([])
      .teams.find((team) => team.key === "mine")!.depthByRun[2]!
    expect(estimate).toBeGreaterThan(1)
    const stale = createPlanEvaluator(withTeam(storedTeam(STRONG, 1)), economy)
      .evaluate([])
      .teams.find((team) => team.key === "mine")!
    expect(stale.depthByRun[2]).toBe(estimate)
    const deeper = createPlanEvaluator(
      withTeam(storedTeam(STRONG, estimate + 3)),
      economy
    )
      .evaluate([])
      .teams.find((team) => team.key === "mine")!
    expect(deeper.depthByRun[2]).toBe(estimate + 3)
  })

  it("offers to swap a kept team a generated one beats", () => {
    // Saved with one objective, the same units are generated scoring two.
    const inputs = withTeam({
      ...storedTeam(STRONG, null),
      objectiveIndexes: [0],
    })
    const evaluation = createPlanEvaluator(inputs, economy).evaluate([])
    const [swap] = teamSwaps(inputs, economy, NO_TEAM_ADJUSTMENTS, evaluation)
    expect(swap).toMatchObject({ laneId: "alpha", teamKey: "mine" })
    expect(swap!.gain).toBeGreaterThan(0)
    expect(swap!.replacements.map((team) => team.objectiveIndexes)).toEqual([
      [0, 3],
    ])
  })

  it("offers no swap for a kept team nothing beats", () => {
    const inputs = withTeam({
      ...storedTeam(STRONG, null),
      objectiveIndexes: [0, 3],
    })
    const evaluation = createPlanEvaluator(inputs, economy).evaluate([])
    expect(teamSwaps(inputs, economy, NO_TEAM_ADJUSTMENTS, evaluation)).toEqual(
      []
    )
  })
})

describe("upgrade recommendations", () => {
  const base = {
    alreadyPlanned: () => false,
    masterTotal: () => 0,
    hordeMultiplier: () => 1,
  }

  it("recommends steps that raise the ceiling, queued in order", () => {
    const inputs = planInputs()
    const result = recommendUpgradesNow({
      ...base,
      inputs,
      evaluator: createPlanEvaluator(inputs, economy),
      targetPoints: Number.POSITIVE_INFINITY,
      farmingDays: (_, steps) => steps.length * 10,
      cap: 4,
    })
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeLessThanOrEqual(4)
    const ceilings = result.recommendations.map((entry) => entry.ceilingAfter)
    expect(ceilings).toEqual([...ceilings].sort((a, b) => a - b))
    expect(result.final.ceiling).toBeGreaterThan(result.baseline.ceiling!)
    expect(result.recommendations.every((entry) => entry.firstRun === 3)).toBe(
      true
    )
    const ready = chosenFrom(result.recommendations, NOW_MS).map(
      (entry) => entry.readyMs
    )
    expect(ready).toEqual(result.recommendations.map((entry) => entry.readyMs))
  })

  it("gives the same result run in slices as in one go", () => {
    const inputs = planInputs()
    const input = {
      ...base,
      inputs,
      targetPoints: Number.POSITIVE_INFINITY,
      farmingDays: (_: string, steps: readonly unknown[]) => steps.length * 10,
      cap: 4,
    }
    const whole = recommendUpgradesNow({
      ...input,
      evaluator: createPlanEvaluator(inputs, economy),
    })
    // A clock where every step overruns its slice, and slices run on demand.
    let time = 0
    const queue: (() => void)[] = []
    const clock: SliceClock = {
      now: () => ++time,
      schedule: (work) => {
        queue.push(() => work(time))
        return () => undefined
      },
      scheduleIdle: (work) => {
        queue.push(() => work(time))
        return () => undefined
      },
    }
    let sliced: ReturnType<typeof recommendUpgradesNow> | null = null
    let slices = 0
    runSliced(
      recommendUpgrades({
        ...input,
        evaluator: createPlanEvaluator(inputs, economy),
      }),
      {
        clock,
        onYield: () => undefined,
        onDone: (value) => {
          sliced = value
        },
      }
    )
    while (queue.length > 0) {
      queue.shift()!()
      slices++
    }
    expect(slices).toBeGreaterThan(whole.recommendations.length)
    expect(sliced!.recommendations).toEqual(whole.recommendations)
    expect(sliced!.final.ceiling).toBe(whole.final.ceiling)
  })

  it("drops a step ready after the last run starts", () => {
    const inputs = planInputs()
    const days = Math.ceil((RUN_3_START_MS - NOW_MS) / DAY_MS) + 1
    const result = recommendUpgradesNow({
      ...base,
      inputs,
      evaluator: createPlanEvaluator(inputs, economy),
      targetPoints: Number.POSITIVE_INFINITY,
      farmingDays: () => days,
    })
    expect(result.recommendations).toEqual([])
  })

  it("stops once the target is within the ceiling", () => {
    const inputs = planInputs()
    const result = recommendUpgradesNow({
      ...base,
      inputs,
      evaluator: createPlanEvaluator(inputs, economy),
      targetPoints: 0,
      farmingDays: () => 1,
    })
    expect(result.recommendations).toEqual([])
  })
})

describe("targets and verdicts", () => {
  it("offers every step from Unlock when the unit is not owned", () => {
    const targets = stepTargets(planInputs(), economy)
    expect(targets.map((target) => target.step)[0]).toBe("unlock")
    expect(targets.every((target) => target.kind === "points")).toBe(true)
  })

  it("labels each step against the two ceilings", () => {
    const target = (points: number): StepTarget => ({
      step: "unlock",
      kind: "points",
      points,
    })
    expect(stepVerdict(target(5000), 6136, 10450)).toEqual({
      kind: "reachableNow",
      spare: 1136,
    })
    expect(stepVerdict(target(10000), 6136, 10450)).toEqual({
      kind: "needsUpgrades",
      short: 3864,
    })
    expect(stepVerdict(target(12000), 6136, 10450)).toEqual({
      kind: "tooAmbitious",
      short: 5864,
    })
    expect(
      bestStepWithinReach([
        { step: "fourStars", verdict: { kind: "needsUpgrades", short: 1 } },
        { step: "fiveStars", verdict: { kind: "needsUpgrades", short: 2 } },
        { step: "blueStar", verdict: { kind: "tooAmbitious", short: 3 } },
      ])
    ).toBe("fiveStars")
  })
})
