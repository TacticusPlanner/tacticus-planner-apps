import { describe, expect, it } from "vitest"

import {
  buildLanePointsModel,
  type LanePointsModel,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
  type LegendaryEventObjective,
} from "@/entities/legendary-event"

import { lostaBileLanes } from "./token-plan.lostabile.fixtures"
import {
  planTokens,
  type TokenPlanLane,
  type TokenPlanTeam,
} from "./token-plan"

// V1 `token-estimation-service.spec.ts` › computeNextToken / computeAllTokenUsage, translated:
// V1's `_killPoints` and `_highScore` (equal in every case) are the battle's two awards of one V2
// `battlesPoints` each (the kill score and the high score), `_defeatAll` is cell 0, and V1's named
// restrictions become the lane's objectives in order (cell `index + 1`). A V1 battle with its three
// default requirements cleared is a V2 battle with defeat-all cleared at a full kill score and a
// full high score.

interface V1Lane {
  laneId: LegendaryEventLaneId
  battles: number
  /** `_killPoints`, equal to `_highScore`: one award's `battlesPoints`. */
  battlePoints: number
  defeatAll: number
  objectives: [name: string, points: number][]
}

function model({
  battles,
  battlePoints,
  defeatAll,
  objectives,
}: V1Lane): LanePointsModel {
  const objectiveScores = objectives.map(([, points]) => points)
  const total = objectiveScores.reduce((sum, points) => sum + points, 0)
  return {
    objectives: objectives.map(
      ([name, points], index) =>
        ({ name, points, index }) as unknown as LegendaryEventObjective
    ),
    battles: Array.from({ length: battles }, (_, index) => ({
      index,
      battlePoints,
      defeatAllPoints: defeatAll,
      objectiveScores,
      maxPoints: battlePoints * 2 + defeatAll + total,
    })),
    maxPoints: battles * (battlePoints * 2 + defeatAll + total),
  }
}

/** Synced encounters: per battle, the names cleared (`"defaults"` = defeat-all at a full score). */
function synced(lane: V1Lane, cleared: string[][]): LegendaryEventLaneRecord {
  return {
    encounters: cleared.map((names) => {
      const defaults = names.includes("defaults")
      return {
        objectivesCleared: [
          ...(defaults ? [0] : []),
          ...lane.objectives.flatMap(([name], index) =>
            names.includes(name) ? [index + 1] : []
          ),
        ],
        highScore: defaults ? lane.battlePoints : 0,
        encounterPoints: defaults ? lane.battlePoints : 0,
      }
    }),
  } as unknown as LegendaryEventLaneRecord
}

function team(
  lane: V1Lane,
  id: string,
  restrictions: string[],
  depth: number
): TokenPlanTeam {
  return {
    id,
    name: id,
    objectiveIndexes: lane.objectives.flatMap(([name], index) =>
      restrictions.includes(name) ? [index] : []
    ),
    depth,
  }
}

function lane(
  v1: V1Lane,
  teams: TokenPlanTeam[],
  cleared: string[][] = []
): TokenPlanLane {
  return {
    laneId: v1.laneId,
    model: model(v1),
    synced: synced(v1, cleared),
    teams,
    annotations: [],
  }
}

const alpha: V1Lane = {
  laneId: "alpha",
  battles: 3,
  battlePoints: 45,
  defeatAll: 60,
  objectives: [
    ["NoPierce", 50],
    ["Pierce", 60],
    ["Flame", 70],
    ["NoFlame", 80],
    ["OnlyOrks", 90],
  ],
}

describe("V1 parity: computeNextToken", () => {
  it("returns a clear best token", () => {
    const plan = planTokens({
      lanes: [
        lane(alpha, [
          team(alpha, "team1", ["Pierce", "Flame"], 1),
          team(alpha, "team2", ["Pierce"], 2),
        ]),
      ],
      startingPoints: 0,
    })

    expect(plan.tokens[0]).toMatchObject({
      teamId: "team1",
      battleIndex: 0,
      points: 45 + 45 + 60 + 60 + 70,
      clearedIds: [0, 2, 3],
    })
  })

  it("plans nothing when every battle is complete", () => {
    const all = ["defaults", ...alpha.objectives.map(([name]) => name)]
    const plan = planTokens({
      lanes: [
        lane(
          alpha,
          [team(alpha, "team1", ["Pierce", "Flame"], 1)],
          [all, all, all]
        ),
      ],
      startingPoints: 0,
    })

    expect(plan.tokens).toEqual([])
  })

  it("returns the lower of two equal battles in one lane", () => {
    const cleared = ["defaults", "Pierce"]
    const plan = planTokens({
      lanes: [
        lane(
          alpha,
          [team(alpha, "team1", ["NoPierce"], 3)],
          [cleared, cleared, cleared]
        ),
      ],
      startingPoints: 0,
    })

    expect(plan.tokens[0]).toMatchObject({
      teamId: "team1",
      battleIndex: 0,
      points: 50,
    })
  })

  it("picks the better lane when another lane's battle is only partly unlocked", () => {
    const small = (
      laneId: LegendaryEventLaneId,
      objective: string
    ): V1Lane => ({
      laneId,
      battles: 3,
      battlePoints: 45,
      defeatAll: 60,
      objectives: [[objective, 60]],
    })
    const a = small("alpha", "Pierce")
    const b = small("beta", "Power")
    const g = small("gamma", "Toxic")
    const plan = planTokens({
      lanes: [
        lane(
          a,
          [team(a, "team1", ["Pierce"], 3)],
          [["defaults", "Pierce"], ["Pierce"]]
        ),
        lane(b, [team(b, "team2", ["Power"], 3)], [["defaults", "Power"]]),
        lane(g, [], [["defaults"]]),
      ],
      startingPoints: 0,
    })

    // Alpha battle 2 is worth 45 + 45 + 60 = 150 (Pierce already in); Beta battle 2 is
    // 45 + 45 + 60 + 60.
    expect(plan.tokens[0]).toMatchObject({
      laneId: "beta",
      teamId: "team2",
      battleIndex: 1,
      points: 210,
    })
  })
})

describe("V1 parity: computeAllTokenUsage", () => {
  it("plays each lane's battles in order", () => {
    const a: V1Lane = {
      laneId: "alpha",
      battles: 3,
      battlePoints: 45,
      defeatAll: 60,
      objectives: [
        ["Physical", 70],
        ["Pierce", 80],
        ["Power", 35],
        ["Plasma", 105],
        ["Psychic", 60],
      ],
    }
    const b: V1Lane = {
      laneId: "beta",
      battles: 3,
      battlePoints: 40,
      defeatAll: 70,
      objectives: [
        ["BlackLegion", 120],
        ["WorldEaters", 60],
        ["ThousandSons", 50],
        ["DeathGuard", 40],
        ["EmperorsChildren", 80],
      ],
    }
    const g: V1Lane = {
      laneId: "gamma",
      battles: 3,
      battlePoints: 50,
      defeatAll: 50,
      objectives: [
        ["Max1Hits", 100],
        ["Max2Hits", 75],
        ["Max3Hits", 80],
        ["Min5Hits", 30],
        ["Min6Hits", 65],
      ],
    }
    const plan = planTokens({
      lanes: [
        lane(a, [
          team(a, "alpha-team-1", ["Physical", "Pierce"], 2),
          team(a, "alpha-team-2", ["Power", "Plasma"], 2),
          team(a, "alpha-team-3", ["Psychic"], 1),
        ]),
        lane(b, [
          team(b, "beta-team-1", ["BlackLegion", "WorldEaters"], 2),
          team(b, "beta-team-2", ["ThousandSons", "DeathGuard"], 2),
          team(b, "beta-team-3", ["EmperorsChildren"], 1),
        ]),
        lane(g, [
          team(g, "gamma-team-1", ["Max1Hits", "Max2Hits"], 2),
          team(g, "gamma-team-2", ["Max3Hits", "Min5Hits", "Min6Hits"], 3),
        ]),
      ],
      startingPoints: 0,
    })

    expect(plan.tokens.length).toBeGreaterThan(0)
    // Every battle a token plays had its predecessor played (or won) earlier in the plan.
    const won = new Set<string>()
    for (const token of plan.tokens) {
      if (token.battleIndex > 0) {
        expect(won.has(`${token.laneId}:${token.battleIndex - 1}`)).toBe(true)
      }
      won.add(`${token.laneId}:${token.battleIndex}`)
    }
  })

  it("plans nothing when the teams can clear nothing more", () => {
    const v1: V1Lane = {
      laneId: "alpha",
      battles: 2,
      battlePoints: 45,
      defeatAll: 60,
      objectives: [
        ["Pierce", 60],
        ["Flame", 70],
        ["Power", 80],
      ],
    }
    const plan = planTokens({
      lanes: [
        lane(
          v1,
          [team(v1, "team1", ["Pierce"], 2), team(v1, "team2", ["Flame"], 1)],
          [
            ["defaults", "Pierce", "Flame"],
            ["defaults", "Pierce", "Flame"],
          ]
        ),
      ],
      startingPoints: 0,
    })

    expect(plan.tokens).toEqual([])
  })
})

// The V1 plan for Fabius Bile (`lostaBile`, no synced progress) with the teams and depths below:
// 55 tokens worth 8,615 points.
describe("V1 parity: Fabius Bile plan", () => {
  const objectiveIndexes = (
    laneId: LegendaryEventLaneId,
    names: string[]
  ): number[] =>
    names.map((name) =>
      lostaBileLanes[laneId].unitsRestrictions.findIndex(
        (objective) => objective.name === name
      )
    )
  const fabiusLane = (
    laneId: LegendaryEventLaneId,
    teams: [objectives: string[], depth: number][]
  ): TokenPlanLane => ({
    laneId,
    model: buildLanePointsModel(lostaBileLanes[laneId]),
    synced: undefined,
    teams: teams.map(([objectives, depth]) => ({
      id: `${laneId}: ${objectives.join(" + ")}`,
      name: objectives.join(" + "),
      objectiveIndexes: objectiveIndexes(laneId, objectives),
      depth,
    })),
    annotations: [],
  })

  const plan = planTokens({
    lanes: [
      fabiusLane("alpha", [
        [["Final Justice", "Max 2 hits"], 6],
        [["Black Templars"], 5],
        [["No Bolter", "Blast"], 4],
        [["No Bolter", "Max 2 hits"], 7],
        [["Final Justice"], 7],
      ]),
      fabiusLane("beta", [
        [["No Power", "Piercing"], 6],
        [["Max 3 hits", "Parry"], 5],
        [["Teleport Strike"], 6],
      ]),
      fabiusLane("gamma", [
        [["Min 5 hits", "Mechanical"], 6],
        [["No Flying", "Flame"], 5],
        [["Infiltrate"], 4],
        [["Mechanical"], 7],
        [["Flame"], 6],
        [["No Flying"], 7],
      ]),
    ],
    startingPoints: 0,
  })

  it("plans 55 tokens worth 8,615 points", () => {
    expect(plan.tokens).toHaveLength(55)
    expect(plan.totalPoints).toBe(8615)
  })

  it("plays every first pass best first, each award of a won battle counted", () => {
    expect(
      plan.tokens
        .slice(0, 20)
        .map((token) => [token.laneId, token.battleIndex + 1, token.points])
    ).toEqual([
      // Alpha: battlesPoints × 2 + 37 + Final Justice 90 + Max 2 hits 60 (31 + 31 + 37 + 150).
      ["alpha", 1, 249],
      ["alpha", 2, 253],
      ["alpha", 3, 257],
      ["alpha", 4, 261],
      ["alpha", 5, 265],
      ["alpha", 6, 269],
      // Gamma: battlesPoints × 2 + 46 + Min 5 hits 70 + Mechanical 80 (23 + 23 + 46 + 150).
      ["gamma", 1, 242],
      ["gamma", 2, 258],
      ["gamma", 3, 260],
      ["gamma", 4, 268],
      ["gamma", 5, 268],
      ["gamma", 6, 270],
      // Beta: battlesPoints × 2 + 40 + No Power 50 + Piercing 90 (29 + 29 + 40 + 140).
      ["beta", 1, 238],
      ["beta", 2, 242],
      ["beta", 3, 246],
      ["beta", 4, 250],
      ["beta", 5, 254],
      ["beta", 6, 258],
      // Gamma 7: 39 + 39 + 46 + Mechanical 80; Alpha 7: 38 + 38 + 37 + 90.
      ["gamma", 7, 204],
      ["alpha", 7, 203],
    ])
  })

  it("then plays 35 second-pass tokens on objectives alone", () => {
    const secondPass = plan.tokens.slice(20)
    expect(secondPass.every((token) => !token.clearedIds.includes(0))).toBe(
      true
    )
    const counts = new Map<number, number>()
    for (const token of secondPass) {
      counts.set(token.points, (counts.get(token.points) ?? 0) + 1)
    }
    expect([...counts].sort(([a], [b]) => b - a)).toEqual([
      [140, 5],
      [125, 9],
      [100, 9],
      [95, 7],
      [90, 1],
      [30, 4],
    ])
  })
})
