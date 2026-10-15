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
      // Battle 3: 35 kill score + 30 defeat-all + 75 Ultramarines + 65 Melee.
      ["alpha", "melee", 3, 205, 5205],
      // Battle 4 opens once battle 3 is won: 39 + 30 + 140.
      ["alpha", "melee", 4, 209, 5414],
      ["alpha", "melee", 5, 211, 5625],
      // Melee's depth 5 does not reach battle 6: Five plays it, 43 + 30 + 75.
      ["alpha", "five", 6, 148, 5773],
      // Battle 2: Ultramarines + Melee (defeat-all and the high score are already in).
      ["alpha", "melee", 2, 140, 5913],
      // Battle 1: Melee only.
      ["alpha", "melee", 1, 65, 5978],
    ])
    expect(plan.totalPoints).toBe(978)
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

    expect(plan.totalPoints).toBe(978)
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
      ["alpha", "melee", 3, 205, 5205],
      ["alpha", "melee", 2, 140, 5345],
      ["alpha", "melee", 1, 65, 5410],
    ])
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

  it("counts a partial high score once the battle is won", () => {
    const plan = planTokens({
      lanes: [
        utharLane("alpha", {
          synced: {
            encounters: [
              { objectivesCleared: [0], highScore: 20, encounterPoints: 20 },
            ],
          } as typeof workedAlphaRecord,
          teams: [{ ...fiveTeam, objectiveIndexes: [], depth: 1 }],
        }),
      ],
      startingPoints: 0,
    })

    expect(summary(plan.tokens)).toEqual([["alpha", "five", 1, 9, 9]])
    expect(plan.tokens[0]?.clearedIds).toEqual([])
  })

  it("starts a lane with no synced record from battle 1", () => {
    const plan = planTokens({
      lanes: [utharLane("alpha", { teams: [{ ...fiveTeam, depth: 1 }] })],
      startingPoints: 0,
    })

    // 29 kill score + 30 defeat-all + 75 Ultramarines.
    expect(summary(plan.tokens)).toEqual([["alpha", "five", 1, 134, 134]])
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

    // Alpha battle 1 (59) wins the first tie by lane order; Alpha battle 2 (61) then beats Beta
    // battle 1 (59); Beta follows.
    expect(summary(plan.tokens)).toEqual([
      ["alpha", "a", 1, 59, 59],
      ["alpha", "a", 2, 61, 120],
      ["beta", "b", 1, 59, 179],
      ["beta", "b", 2, 61, 240],
    ])
  })

  it("lets the same team continue over an earlier lane when the points tie", () => {
    // Alpha battle 1 and Beta battle 2 are both worth 61 to defeat-all-only teams once Beta
    // battle 1 is played; Beta's team continues.
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
      ["beta", "b", 1, 70, 70],
      ["beta", "b", 2, 61, 131],
      ["alpha", "a", 1, 61, 192],
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
      sameTeam: false,
      token: { teamId: "melee", battleIndex: 2, points: 205 },
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

  it("is null for an empty plan", () => {
    expect(nextToken({ tokens: [] })).toBeNull()
  })
})
