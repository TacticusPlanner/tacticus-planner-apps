import { describe, expect, it } from "vitest"

import {
  fiveTeam,
  mark,
  meleeTeam,
  utharLane,
  workedAlphaRecord,
  workedLanes,
} from "./token-plan.fixtures"
import { nextToken, planTokens, type PlannedToken } from "./token-plan"

const summary = (tokens: PlannedToken[]) =>
  tokens.map((token) => [
    token.laneId,
    token.teamId,
    token.battleIndex + 1,
    token.points,
    token.runningPoints,
  ])

describe("planTokens", () => {
  it("works the Uthar Alpha example", () => {
    const plan = planTokens({ lanes: workedLanes(), startingPoints: 5000 })

    expect(summary(plan.tokens)).toEqual([
      // Battle 3: 35 kill score + 35 high score + 30 defeat-all + 75 Ultramarines + 65 Melee.
      ["alpha", "melee", 3, 240, 5240],
      // Battle 4 opens once battle 3 is won: 39 + 39 + 30 + 140.
      ["alpha", "melee", 4, 248, 5488],
      // 41 + 41 + 30 + 140.
      ["alpha", "melee", 5, 252, 5740],
      // Melee's depth 5 does not reach battle 6: Five plays it, 43 + 43 + 30 + 75.
      ["alpha", "five", 6, 191, 5931],
      // Battle 2: Ultramarines + Melee (defeat-all and both scores are already in).
      ["alpha", "melee", 2, 140, 6071],
      // Battle 1: Melee only.
      ["alpha", "melee", 1, 65, 6136],
    ])
    expect(plan.totalPoints).toBe(1136)
    expect(plan.tokens[0]?.clearedIds).toEqual([0, 1, 4])
    expect(plan.tokens.every((token) => !token.maybe)).toBe(true)
    expect(plan.tokens.map((token) => token.playableNow)).toEqual([
      true,
      false,
      false,
      false,
      true,
      true,
    ])
  })

  it("flags a token that clears a Maybe clear cell but keeps it", () => {
    const plan = planTokens({
      lanes: workedLanes({ annotations: [mark(2, 4, "maybeClear")] }),
      startingPoints: 5000,
    })

    expect(plan.totalPoints).toBe(1136)
    expect(plan.tokens.map((token) => token.maybe)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ])
  })

  it("stops the lane at a Stop here defeat-all", () => {
    const plan = planTokens({
      lanes: workedLanes({ annotations: [mark(3, 0, "stopHere")] }),
      startingPoints: 5000,
    })

    expect(summary(plan.tokens)).toEqual([
      ["alpha", "melee", 3, 240, 5240],
      ["alpha", "melee", 2, 140, 5380],
      ["alpha", "melee", 1, 65, 5445],
    ])
    expect(plan.totalPoints).toBe(445)
  })

  it("drops only the objective marked Stop here", () => {
    const plan = planTokens({
      lanes: workedLanes({ annotations: [mark(1, 4, "stopHere")] }),
      startingPoints: 0,
    })
    const battle2 = plan.tokens.filter((token) => token.battleIndex === 1)

    expect(battle2.map((token) => [token.points, token.clearedIds])).toEqual([
      [75, [1]],
    ])
  })

  it("plans nothing for a team without a depth", () => {
    const plan = planTokens({
      lanes: workedLanes({ teams: [{ ...meleeTeam, depth: null }] }),
      startingPoints: 0,
    })

    expect(plan.tokens).toEqual([])
  })

  it("counts the kill score left and the high score left once the battle is won", () => {
    const plan = planTokens({
      lanes: [
        utharLane("alpha", {
          synced: {
            encounters: [
              { objectivesCleared: [0], highScore: 20, encounterPoints: 25 },
            ],
          } as typeof workedAlphaRecord,
          teams: [{ ...fiveTeam, objectiveIndexes: [], depth: 1 }],
        }),
      ],
      startingPoints: 0,
    })

    // Battle 1 (battlesPoints 29): (29 − 25) + (29 − 20).
    expect(summary(plan.tokens)).toEqual([["alpha", "five", 1, 13, 13]])
    expect(plan.tokens[0]?.clearedIds).toEqual([])
  })

  it("starts a lane with no synced record from battle 1", () => {
    const plan = planTokens({
      lanes: [utharLane("alpha", { teams: [{ ...fiveTeam, depth: 1 }] })],
      startingPoints: 0,
    })

    // 29 kill score + 29 high score + 30 defeat-all + 75 Ultramarines.
    expect(summary(plan.tokens)).toEqual([["alpha", "five", 1, 163, 163]])
  })

  it("prefers the same team on its next battle on a tie", () => {
    // Beta battle 1 and Gamma battle 1 are worth the same to a defeat-all-only team; after the
    // Gamma team's first token, its battle 2 ties with Beta's battle 1 only if their values match,
    // so build a tie directly: two lanes with identical models and teams.
    const team = { id: "t", name: "T", objectiveIndexes: [], depth: 2 }
    const plan = planTokens({
      lanes: [
        utharLane("alpha", { teams: [{ ...team, id: "a" }] }),
        utharLane("alpha", { teams: [{ ...team, id: "b" }] }),
      ].map((lane, index) => ({
        ...lane,
        laneId: index === 0 ? "alpha" : "beta",
      })),
      startingPoints: 0,
    })

    // Alpha battle 1 (29 + 29 + 30 = 88) wins the first tie by lane order; Alpha battle 2
    // (31 + 31 + 30 = 92) then beats Beta battle 1 (88); Beta follows.
    expect(summary(plan.tokens)).toEqual([
      ["alpha", "a", 1, 88, 88],
      ["alpha", "a", 2, 92, 180],
      ["beta", "b", 1, 88, 268],
      ["beta", "b", 2, 92, 360],
    ])
  })

  it("lets the same team continue over an earlier lane when the points tie", () => {
    // Alpha battle 1 and Beta battle 2 are both worth 31 + 31 + 30 = 92 to defeat-all-only teams
    // once Beta battle 1 is played; Beta's team continues.
    const team = { id: "t", name: "T", objectiveIndexes: [], depth: 2 }
    const alpha = {
      ...utharLane("alpha", { teams: [{ ...team, id: "a", depth: 1 }] }),
    }
    alpha.model = {
      ...alpha.model,
      battles: alpha.model.battles.map((battle) =>
        battle.index === 0 ? { ...battle, battlePoints: 31 } : battle
      ),
    }
    const beta = {
      ...utharLane("alpha", { teams: [{ ...team, id: "b" }] }),
      laneId: "beta" as const,
    }
    beta.model = {
      ...beta.model,
      battles: beta.model.battles.map((battle) =>
        battle.index === 0 ? { ...battle, battlePoints: 40 } : battle
      ),
    }
    const plan = planTokens({ lanes: [alpha, beta], startingPoints: 0 })

    expect(summary(plan.tokens)).toEqual([
      ["beta", "b", 1, 110, 110],
      ["beta", "b", 2, 92, 202],
      ["alpha", "a", 1, 92, 294],
    ])
  })

  it("reports the points left per lane after the plan", () => {
    const plan = planTokens({ lanes: workedLanes(), startingPoints: 5000 })
    const alpha = plan.lanes.find((lane) => lane.laneId === "alpha")

    expect(alpha?.completeInSync).toBe(false)
    expect(alpha?.pointsLeftAfterPlan).toBeGreaterThan(0)
  })
})

describe("nextToken", () => {
  it("is the plan's first token with no marks", () => {
    const choice = nextToken(
      planTokens({ lanes: workedLanes(), startingPoints: 5000 })
    )

    expect(choice).toMatchObject({
      index: 0,
      reason: "mostPoints",
      token: { teamId: "melee", battleIndex: 2, points: 240 },
    })
  })

  it("skips flagged and not-yet-playable tokens", () => {
    const choice = nextToken(
      planTokens({
        lanes: workedLanes({ annotations: [mark(2, 4, "maybeClear")] }),
        startingPoints: 5000,
      })
    )

    expect(choice).toMatchObject({
      index: 4,
      reason: "mostPointsPlayableNow",
      token: { teamId: "melee", battleIndex: 1, points: 140 },
    })
  })

  it("skips a token on the battle of an earlier skipped token", () => {
    const token = (
      battleIndex: number,
      teamId: string,
      overrides: Partial<PlannedToken> = {}
    ): PlannedToken => ({
      laneId: "alpha",
      battleIndex,
      teamId,
      teamName: teamId,
      clearedIds: [1],
      points: 50,
      runningPoints: 0,
      maybe: false,
      playableNow: true,
      ...overrides,
    })
    // The flagged token wins battle 3; the second one is valued as if it had.
    const choice = nextToken({
      tokens: [
        token(2, "melee", { clearedIds: [0, 1], maybe: true }),
        token(2, "five"),
        token(1, "five"),
      ],
    })

    expect(choice).toMatchObject({
      index: 2,
      token: { teamId: "five", battleIndex: 1 },
    })
  })

  it("is null for an empty plan", () => {
    expect(nextToken({ tokens: [] })).toBeNull()
  })
})
