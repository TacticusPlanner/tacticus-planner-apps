import { describe, expect, it } from "vitest"

import { buildCurrentRunStatusModel } from "./current-run-status.view-model"
import {
  currentRunView,
  syncedRunStatus,
} from "../../ui/legendary-event/current-run-status.fixtures"

describe("buildCurrentRunStatusModel", () => {
  it("puts each resource's now and end-of-run values on one row", () => {
    const model = buildCurrentRunStatusModel(syncedRunStatus, currentRunView())

    expect(model.rows).toEqual([
      { key: "points", now: 12_413, end: 12_508, gain: 95 },
      { key: "currency", now: 160, end: 110, gain: 300 },
      { key: "chests", now: 15, end: 16, gain: 1 },
      { key: "shards", now: 375, end: 400, gain: 25 },
    ])
    expect(model.tokensLeft).toBe(1)
    expect(model.unused).toBe(0)
    expect(model.endRun).toEqual({ run: 1, unknown: false })
  })

  it("names the step the run reaches and what follows it", () => {
    expect(
      buildCurrentRunStatusModel(syncedRunStatus, currentRunView()).goal
    ).toEqual({
      kind: "thisRun",
      step: "unlock",
      token: 1,
      then: { step: "fourStars", shardsShort: 120 },
    })
  })

  it("names the shortfall and the later token when the run falls short", () => {
    const view = currentRunView({
      run: {
        endingShards: 375,
        stepsReached: [],
        next: { step: "unlock", threshold: 400 },
        shardsMissing: 25,
      },
      stepAt: 3,
      stepRun: 2,
    })

    expect(buildCurrentRunStatusModel(syncedRunStatus, view).goal).toEqual({
      kind: "later",
      step: "unlock",
      shardsShort: 25,
      at: { token: 4, run: 2 },
    })
  })

  it("reads every step reached once the ladder is done", () => {
    const view = currentRunView({
      run: { next: { step: "fullyAscended" }, shardsMissing: 0 },
      stepAt: null,
    })

    expect(buildCurrentRunStatusModel(syncedRunStatus, view).goal).toEqual({
      kind: "allSteps",
    })
  })

  it("counts unused tokens only when the plan plays some", () => {
    const played = currentRunView({
      run: { tokensUsed: 2, tokensLeftOver: 3 },
    })
    const none = currentRunView({ run: { tokensUsed: 0, tokensLeftOver: 1 } })

    expect(buildCurrentRunStatusModel(syncedRunStatus, played).unused).toBe(3)
    expect(buildCurrentRunStatusModel(syncedRunStatus, none).unused).toBe(0)
  })

  it("has only the Now column without a forecast", () => {
    const model = buildCurrentRunStatusModel(syncedRunStatus, {
      kind: "loading",
    })

    expect(model.endRun).toBeNull()
    expect(model.goal).toBeNull()
    expect(
      model.rows.every((row) => row.end === null && row.gain === null)
    ).toBe(true)
  })
})
