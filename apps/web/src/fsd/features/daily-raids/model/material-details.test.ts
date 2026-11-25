import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"

import {
  exhaustedBattleIdsOf,
  materialAlternatives,
  todaysMaterialCell,
} from "./material-details"

const near = battleIdSchema.parse("B5")
const far = battleIdSchema.parse("B6")
const unknown = battleIdSchema.parse("B7")

describe("materialAlternatives", () => {
  const raids = ready({
    sourcesByResource: new Map([
      [
        "U1",
        { battleIds: [battle, unknown, far, near, offPlanBattle], shops: [] },
      ],
    ]),
    eligibleBattleIds: new Set([battle, offPlanBattle]),
  })

  it("lists raidable nodes first, then locked ones closest first with their distance", () => {
    const { campaigns } = materialAlternatives(
      { resourceId: "U1", nodes: [] },
      raids,
      new Set(),
      [
        { battleId: near, distance: "3 battles to go", notes: [] },
        { battleId: far, distance: "20 battles to go", notes: ["Clear X"] },
      ]
    )
    expect(campaigns).toEqual([
      { battleId: battle, locked: false, notes: [] },
      { battleId: offPlanBattle, locked: false, notes: [] },
      {
        battleId: near,
        locked: true,
        distance: "3 battles to go",
        notes: [],
      },
      {
        battleId: far,
        locked: true,
        distance: "20 battles to go",
        notes: ["Clear X"],
      },
      // Not in Goals' unlock paths (another filter locks it): last, with no distance.
      { battleId: unknown, locked: true, distance: undefined, notes: [] },
    ])
  })

  it("leaves out the day's own nodes and today's raided-out nodes", () => {
    const { campaigns } = materialAlternatives(
      { resourceId: "U1", nodes: [{ battleId: battle, raidsPerformed: 4 }] },
      raids,
      new Set([offPlanBattle])
    )
    expect(campaigns.map((alternative) => alternative.battleId)).toEqual([
      unknown,
      far,
      near,
    ])
  })
})

describe("todaysMaterialCell", () => {
  it("has today's raids, the have / need over every goal and the units in priority order", () => {
    expect(todaysMaterialCell(ready(), "U1")).toMatchObject({
      resourceId: "U1",
      owned: 265,
      target: 500,
      units: [{ unitLabel: "Bellator" }, { unitLabel: "Aleph-Null" }],
      nodes: [{ battleId: battle, raidsPerformed: 7 }],
    })
  })

  it("takes the units from later days when today doesn't raid the material", () => {
    expect(todaysMaterialCell(ready(), "U3")).toMatchObject({
      resourceId: "U3",
      units: [{ unitLabel: "Bellator" }],
      nodes: [],
    })
  })
})

describe("exhaustedBattleIdsOf", () => {
  it("keeps only the nodes with no real attempts left", () => {
    expect(
      exhaustedBattleIdsOf({
        attemptsLeftByBattle: new Map([
          [battle, 0],
          [offPlanBattle, 2],
        ]),
      })
    ).toEqual(new Set([battle]))
  })
})
