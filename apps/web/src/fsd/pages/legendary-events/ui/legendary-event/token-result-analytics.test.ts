import { describe, expect, it } from "vitest"

import { CLEAR_ESTIMATE_CURVE_VERSION } from "@/entities/legendary-event"

import { tokenResultEvent } from "./token-result-analytics"

const shown = {
  estimate: 9,
  fromEstimate: true,
  sureDepth: 7,
  stretchDepth: 10,
  effectivePower: 600_000,
  teamPower: 574_641,
  memberCount: 4,
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
      curveVersion: CLEAR_ESTIMATE_CURVE_VERSION,
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
        depthBefore: { depth: 10, estimated: true },
        depthAfter: 8,
        otherTeamReaches: false,
      })
    ).toMatchObject({ outcome: "stoppedEarly", depthBefore: 10, depthAfter: 8 })
  })
})
