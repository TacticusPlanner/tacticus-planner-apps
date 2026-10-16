import { describe, expect, it } from "vitest"

import type {
  LanePointsModel,
  LegendaryEventLaneId,
  LegendaryEventLaneRecord,
  LegendaryEventObjective,
} from "@/entities/legendary-event"

import {
  planTokens,
  type TokenPlanLane,
  type TokenPlanTeam,
} from "./token-plan"

// V1 `token-estimation-service.spec.ts` › computeNextToken / computeAllTokenUsage, translated:
// V1's `_killPoints` + `_highScore` become one V2 `battlesPoints` of their sum (V2 counts the kill
// score once; design D3 a), `_defeatAll` is cell 0, and V1's named restrictions become the lane's
// objectives in order (cell `index + 1`). A V1 battle with its three default requirements cleared
// is a V2 battle with defeat-all cleared at a full high score.

interface V1Lane {
  laneId: LegendaryEventLaneId
  battles: number
  /** `_killPoints` + `_highScore`. */
  killAndHigh: number
  defeatAll: number
  objectives: [name: string, points: number][]
}

function model({
  battles,
  killAndHigh,
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
      battlePoints: killAndHigh,
      defeatAllPoints: defeatAll,
      objectiveScores,
      maxPoints: killAndHigh * 2 + defeatAll + total,
    })),
    maxPoints: battles * (killAndHigh * 2 + defeatAll + total),
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
        highScore: defaults ? lane.killAndHigh : 0,
        encounterPoints: 0,
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
  killAndHigh: 90,
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
      killAndHigh: 90,
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

    // Alpha battle 2 is worth 90 + 60 = 150 (Pierce already in); Beta battle 2 is 90 + 60 + 60.
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
      killAndHigh: 90,
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
      killAndHigh: 80,
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
      killAndHigh: 100,
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
      killAndHigh: 90,
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
