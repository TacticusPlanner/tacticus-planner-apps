import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import { milestoneGap, type MilestoneGapInput } from "./milestone-push"
import type { TokenPlanLane } from "./token-plan"
import { fiveTeam, mark, meleeTeam, workedLanes } from "./token-plan.fixtures"

// Uthar: 25 shards a chest and Unlock at 400 shards, so 375 synced shards is one chest short.
const input = ({
  lanes,
  tokens = 3,
  shards = 375,
  points = 5000,
  estimateDepthOf = () => null,
}: {
  lanes: TokenPlanLane[]
  tokens?: number
  shards?: number
  points?: number
  estimateDepthOf?: MilestoneGapInput["estimateDepthOf"]
}): MilestoneGapInput => ({
  plan: { lanes, startingPoints: points },
  forecast: {
    rewards: utharEvent.rewards,
    ohSoCloseOffer: utharEvent.ohSoCloseOffer,
    progress: {
      currentPoints: points,
      currentCurrency: 0,
      currentClaimedChestIndex: 0,
      currentShards: shards,
      extraCurrencyPerPayout: null,
    },
    supply: [
      {
        run: 1,
        state: "now",
        unknownRun: false,
        free: tokens,
        ad: 0,
        adTodayPending: false,
        bonusDelivery: 0,
        total: tokens,
      },
    ],
    fromStep: "unlock",
    runs: undefined,
    showPaidOptions: false,
  },
  estimateDepthOf,
})

/** Alpha's battle 3 defeat-all marked Stop here: the lane stops after battle 2. */
const stoppedLanes = () =>
  workedLanes({
    teams: [fiveTeam, { ...meleeTeam, depth: 3 }],
    annotations: [mark(2, 0, "stopHere")],
  })

describe("milestoneGap", () => {
  it("finds the Stop here battle that closes a one-chest gap, net of the token it pushes out", () => {
    const gap = milestoneGap(input({ lanes: stoppedLanes() }))

    expect(gap).toMatchObject({
      run: 1,
      step: "unlock",
      shardsMissing: 25,
      pointsNeeded: 295,
      combined: null,
    })
    expect(gap?.pushes).toHaveLength(1)
    const [push] = gap!.pushes
    expect(push).toMatchObject({
      kind: "stopHere",
      token: { laneId: "alpha", battleIndex: 2, teamId: "melee" },
      closesGap: true,
      displaced: { laneId: "alpha", battleIndex: 0, points: 65 },
    })
    expect(push!.gain).toBeGreaterThanOrEqual(295)
    // No spare token: a retry drops another of the run's tokens.
    expect(push!.retry.displaces).not.toBeNull()
  })

  it("needs fewer points the closer the run is to the next milestone", () => {
    expect(
      milestoneGap(input({ lanes: stoppedLanes(), points: 5200 }))?.pointsNeeded
    ).toBe(95)
  })

  it("pushes nothing out and a retry costs a spare token when the run has tokens left over", () => {
    const gap = milestoneGap(input({ lanes: stoppedLanes(), tokens: 30 }))

    expect(gap?.pushes[0]).toMatchObject({
      kind: "stopHere",
      closesGap: true,
      displaced: null,
      retry: { displaces: null },
    })
  })

  it("offers one more battle for a team whose manual depth is below its estimate", () => {
    const melee = { ...meleeTeam, depth: 2 }
    const gap = milestoneGap(
      input({
        lanes: workedLanes({ teams: [melee] }),
        estimateDepthOf: (teamId) => (teamId === "melee" ? 5 : null),
      })
    )

    expect(gap?.pushes[0]).toMatchObject({
      kind: "belowEstimate",
      token: { laneId: "alpha", battleIndex: 2, teamId: "melee" },
    })
  })

  it("retries the team a Maybe clear stopped", () => {
    const gap = milestoneGap(
      input({
        lanes: workedLanes({
          teams: [{ ...meleeTeam, depth: 2 }],
          annotations: [mark(2, 0, "maybeClear")],
        }),
      })
    )

    expect(gap?.pushes[0]).toMatchObject({
      kind: "maybeClear",
      token: { laneId: "alpha", battleIndex: 2, teamId: "melee" },
    })
  })

  it("never pushes a team past its Stop here, even below its estimate", () => {
    const gap = milestoneGap(
      input({
        lanes: workedLanes({
          teams: [{ ...meleeTeam, depth: 2 }],
          annotations: [mark(2, 0, "stopHere")],
        }),
        estimateDepthOf: () => 5,
      })
    )

    expect(gap?.pushes ?? []).toEqual([])
  })

  it("skips a team whose manual depth matches its estimate", () => {
    const gap = milestoneGap(
      input({
        lanes: workedLanes({ teams: [{ ...meleeTeam, depth: 2 }] }),
        estimateDepthOf: () => 2,
      })
    )

    expect(gap?.pushes ?? []).toEqual([])
  })

  it("is null when the run is more than two chests short", () => {
    expect(
      milestoneGap(input({ lanes: stoppedLanes(), shards: 300 }))
    ).toBeNull()
  })

  it("is null when the run already reaches the next step", () => {
    expect(
      milestoneGap(input({ lanes: stoppedLanes(), shards: 400 }))
    ).toBeNull()
  })
})
