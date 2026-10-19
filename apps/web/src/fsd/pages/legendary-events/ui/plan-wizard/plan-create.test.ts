import { describe, expect, it } from "vitest"

import {
  EMPTY_RUN_INPUT_VALUES,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"

import { laterRunDepths, planWrites } from "./plan-create"
import type { UnitGoalChain } from "./plan-draft"
import type { DraftTeam } from "./plan-teams"
import { EMPTY_PLAN } from "./plan.fixtures"

const draftTeam = (overrides: Partial<DraftTeam>): DraftTeam => ({
  key: "alpha:a,b,c",
  laneId: "alpha",
  storedId: null,
  name: "",
  memberUnitIds: ["a", "b", "c"],
  reserveUnitId: null,
  objectiveIndexes: [0],
  depthByRun: { 2: 4, 3: 4 },
  edited: false,
  ...overrides,
})

const PLAN: LegendaryEventPlan = {
  ...EMPTY_PLAN,
  teams: [
    {
      id: "stored",
      laneId: "alpha",
      name: "Mine",
      sortOrder: 0,
      memberUnitIds: ["x", "y", "z"],
      reserveUnitId: null,
      objectiveIndexes: [1],
      runDepths: [],
    },
  ],
}

const chain = (unitId: string, alreadyPlanned: boolean): UnitGoalChain => ({
  unitId,
  from: undefined,
  steps: [],
  request: { unitId, from: undefined },
  alreadyPlanned,
})

const economy = { runs: [], showPaidOptions: false }

describe("planWrites", () => {
  it("writes nothing for kept stored teams and creates the generated ones", () => {
    const writes = planWrites({
      plan: PLAN,
      teams: [draftTeam({ key: "stored", storedId: "stored" }), draftTeam({})],
      chains: [],
      runs: [2, 3],
      economy,
    })
    expect(writes.lanes).toHaveLength(1)
    expect(writes.lanes[0]!.remove).toEqual([])
    expect(writes.lanes[0]!.create.map((team) => team.key)).toEqual([
      "alpha:a,b,c",
    ])
  })

  it("removes the stored teams the draft dropped", () => {
    const writes = planWrites({
      plan: PLAN,
      teams: [],
      chains: [],
      runs: [2, 3],
      economy,
    })
    expect(writes.lanes).toEqual([
      { laneId: "alpha", remove: ["stored"], create: [] },
    ])
  })

  it("skips goals already planned and unchanged run inputs", () => {
    const writes = planWrites({
      plan: PLAN,
      teams: [draftTeam({ key: "stored", storedId: "stored" })],
      chains: [chain("calgar", false), chain("dante", true)],
      runs: [2, 3],
      economy,
    })
    expect(writes.goals.map((entry) => entry.unitId)).toEqual(["calgar"])
    expect(writes.lanes).toEqual([])
    expect(writes.runs).toEqual([])
    expect(writes.showPaidOptions).toBeNull()
  })

  it("saves edited runs and a changed Show paid options", () => {
    const writes = planWrites({
      plan: PLAN,
      teams: [draftTeam({ key: "stored", storedId: "stored" })],
      chains: [],
      runs: [2, 3],
      economy: {
        showPaidOptions: true,
        runs: [
          {
            run: 3,
            ...EMPTY_RUN_INPUT_VALUES,
            regularMissions: 5,
            updatedAt: "",
          },
        ],
      },
    })
    expect(writes.runs).toEqual([
      { run: 3, values: { ...EMPTY_RUN_INPUT_VALUES, regularMissions: 5 } },
    ])
    expect(writes.showPaidOptions).toBe(true)
  })
})

describe("laterRunDepths", () => {
  it("stores a later run's depth only when it differs from the first run's", () => {
    expect(laterRunDepths(draftTeam({}), [2, 3])).toEqual([])
    expect(
      laterRunDepths(draftTeam({ depthByRun: { 2: 4, 3: 6 } }), [2, 3])
    ).toEqual([{ run: 3, depth: 6 }])
  })
})
