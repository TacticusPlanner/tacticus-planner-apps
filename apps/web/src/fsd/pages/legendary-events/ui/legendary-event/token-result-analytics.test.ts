import { describe, expect, it } from "vitest"

import { CLEAR_ESTIMATE_CURVE_VERSION } from "@/entities/legendary-event"

import { tokenBattleSnapshot, tokenResultEvent } from "./token-result-analytics"

const shown = {
  estimate: 9,
  fromEstimate: true,
  sureDepth: 7,
  stretchDepth: 10,
  effectivePower: 600_000,
  teamPower: 574_641,
  memberCount: 4,
  unitIds: ["trajann", "incisus", "tarvakh", "hascule"],
  objectiveIndexes: [0, 1, 4],
  memberPowers: [300_000, 150_000, 80_000, 44_641],
  source: "tokenAction" as const,
}

describe("tokenResultEvent", () => {
  it("labels Couldn't clear with the estimate the player saw and the depth change", () => {
    expect(
      tokenResultEvent({
        eventId: "fabiusBile",
        run: 2,
        laneId: "beta",
        battleIndex: 8,
        action: "stopHere",
        shown,
        battle: { battlePower: 350_333, powerRatio: 1.012 },
        depthBefore: { depth: 9, estimated: true },
        depthAfter: 8,
        otherTeamReaches: true,
      })
    ).toEqual({
      type: "legendary_event_token_result",
      eventId: "fabiusBile",
      run: 2,
      laneId: "beta",
      battleIndex: 8,
      outcome: "couldNotClear",
      estimate: 9,
      depthBefore: 9,
      depthBeforeManual: false,
      depthAfter: 8,
      otherTeamReaches: true,
      sureDepth: 7,
      stretchDepth: 10,
      effectivePower: 600_000,
      teamPower: 574_641,
      memberCount: 4,
      unitIds: ["trajann", "incisus", "tarvakh", "hascule"],
      objectiveIndexes: [0, 1, 4],
      memberPowers: [300_000, 150_000, 80_000, 44_641],
      topMemberShare: 0.522,
      curveVersion: CLEAR_ESTIMATE_CURVE_VERSION,
      battlePower: 350_333,
      powerRatio: 1.012,
    })
  })

  it("labels Partly cleared and reads a missing depth as unknown", () => {
    const event = tokenResultEvent({
      eventId: "fabiusBile",
      run: null,
      laneId: "alpha",
      battleIndex: 0,
      action: "maybeClear",
      shown: { estimate: null, fromEstimate: false },
      battle: { battlePower: null, powerRatio: null },
      depthBefore: undefined,
      depthAfter: null,
      otherTeamReaches: false,
    })
    expect(event).toMatchObject({
      outcome: "partlyCleared",
      depthBefore: null,
      depthBeforeManual: false,
      sureDepth: null,
      teamPower: null,
      memberCount: null,
      unitIds: null,
      objectiveIndexes: null,
    })
  })

  it("labels Stop here as a team stopped early", () => {
    expect(
      tokenResultEvent({
        eventId: "fabiusBile",
        run: 1,
        laneId: "gamma",
        battleIndex: 8,
        action: "stopEarly",
        shown,
        battle: { battlePower: 350_333, powerRatio: 1.012 },
        depthBefore: { depth: 10, estimated: true },
        depthAfter: 8,
        otherTeamReaches: false,
      })
    ).toMatchObject({ outcome: "stoppedEarly", depthBefore: 10, depthAfter: 8 })
  })
})

describe("tokenBattleSnapshot", () => {
  const clears = {
    kind: "ready",
    byLane: {
      beta: {
        team: () => null,
        unit: () => null,
        inputs: {
          battlePowers: [1000, 100_000],
          roster: new Map(),
          config: {},
        },
      },
    },
  } as unknown as Parameters<typeof tokenBattleSnapshot>[0]

  it("reads the battle's power and the curve ratio the shown power reaches", () => {
    expect(
      tokenBattleSnapshot(clears, "beta", 1, { effectivePower: 121_000 })
    ).toEqual({ battlePower: 100_000, powerRatio: 1.21 })
  })

  it("is unknown without estimates or an effective power", () => {
    expect(
      tokenBattleSnapshot({ kind: "hidden" }, "beta", 1, {
        effectivePower: 121_000,
      })
    ).toEqual({ battlePower: null, powerRatio: null })
    expect(
      tokenBattleSnapshot(clears, "beta", 1, { effectivePower: null })
    ).toEqual({ battlePower: 100_000, powerRatio: null })
  })
})
