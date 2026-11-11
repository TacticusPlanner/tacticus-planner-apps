import { describe, expect, it } from "vitest"

import { CLEAR_ESTIMATE_CURVE_VERSION } from "@/entities/legendary-event"
import type { LegendaryEventProgress } from "@/entities/legendary-event"

import {
  forgetShownToken,
  rememberShownToken,
  settleShownTokens,
  tokenClearedEvent,
  type ShownToken,
} from "./token-cleared-analytics"

const token = (overrides: Partial<ShownToken> = {}): ShownToken => ({
  run: 2,
  laneId: "gamma",
  battleIndex: 6,
  teamId: "mech",
  clearedIds: [0, 2],
  depth: 8,
  depthManual: false,
  shown: {
    estimate: 8,
    fromEstimate: true,
    sureDepth: 6,
    stretchDepth: 9,
    effectivePower: 400_000,
    teamPower: 380_000,
    memberCount: 3,
    unitIds: ["revas", "volk", "toth"],
    objectiveIndexes: [1],
    memberPowers: [140_000, 130_000, 110_000],
    source: "tokenAction",
  },
  battle: { battlePower: 135_741, powerRatio: 2.73 },
  ...overrides,
})

const progressWith = (objectivesCleared: number[]) =>
  ({
    id: "fabiusBile",
    gamma: {
      encounters: Array.from({ length: 7 }, (_, index) => ({
        objectivesCleared: index === 6 ? objectivesCleared : [0],
      })),
    },
  }) as unknown as LegendaryEventProgress

describe("shown tokens", () => {
  it("remembers one token per battle and forgets one a card action reported", () => {
    const first = rememberShownToken([], token())
    const replaced = rememberShownToken(first, token({ teamId: "other" }))
    expect(replaced).toEqual([token({ teamId: "other" })])

    const two = rememberShownToken(replaced, token({ laneId: "alpha" }))
    expect(forgetShownToken(two, { laneId: "gamma", battleIndex: 6 })).toEqual([
      token({ laneId: "alpha" }),
    ])
  })

  it("keeps at most twelve tokens, dropping the oldest", () => {
    const tokens = Array.from({ length: 13 }, (_, index) =>
      token({ battleIndex: index })
    ).reduce<ShownToken[]>(rememberShownToken, [])
    expect(tokens).toHaveLength(12)
    expect(tokens[0]?.battleIndex).toBe(1)
  })

  it("settles a token once sync clears every cell it planned to clear", () => {
    expect(settleShownTokens([token()], progressWith([0, 1, 2]), 2)).toEqual({
      cleared: [token()],
      kept: [],
    })
    expect(settleShownTokens([token()], progressWith([0]), 2)).toEqual({
      cleared: [],
      kept: [token()],
    })
    expect(settleShownTokens([token()], undefined, 2)).toEqual({
      cleared: [],
      kept: [token()],
    })
  })

  it("drops tokens of another run", () => {
    expect(
      settleShownTokens([token({ run: 1 })], progressWith([0, 2]), 2)
    ).toEqual({ cleared: [], kept: [] })
  })

  it("logs a cleared token with the estimate shown at the time", () => {
    expect(tokenClearedEvent("fabiusBile", token())).toEqual({
      type: "legendary_event_token_cleared",
      eventId: "fabiusBile",
      run: 2,
      laneId: "gamma",
      battleIndex: 6,
      estimate: 8,
      depth: 8,
      depthManual: false,
      sureDepth: 6,
      stretchDepth: 9,
      effectivePower: 400_000,
      teamPower: 380_000,
      memberCount: 3,
      unitIds: ["revas", "volk", "toth"],
      objectiveIndexes: [1],
      memberPowers: [140_000, 130_000, 110_000],
      topMemberShare: 0.368,
      curveVersion: CLEAR_ESTIMATE_CURVE_VERSION,
      battlePower: 135_741,
      powerRatio: 2.73,
    })
  })
})
