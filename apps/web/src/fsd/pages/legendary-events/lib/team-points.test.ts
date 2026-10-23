import { describe, expect, it } from "vitest"

import {
  lysanderAlphaProgressRecord,
  lysanderEvent,
} from "@/test/fixtures/legendary-events"
import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
} from "@/entities/legendary-event"

import { teamPointsLeft } from "./team-points"

describe("teamPointsLeft", () => {
  const model = buildLanePointsModel(lysanderEvent.alpha)
  const progress = buildSyncedLaneProgress(model, lysanderAlphaProgressRecord)

  it("counts only Flying for a Flying · No Resilient team at depth 11: 11 × 80 = 880", () => {
    expect(
      teamPointsLeft(model, progress, {
        depth: 11,
        coveredObjectiveIndexes: [2, 4],
      })
    ).toBe(880)
  })

  it("earns only battle 14 for a No Resilient team at depth 14: 49 + 49 + 32 + 40 = 170", () => {
    expect(
      teamPointsLeft(model, progress, {
        depth: 14,
        coveredObjectiveIndexes: [4],
      })
    ).toBe(170)
  })

  it("skips the battles where Eviscerate is cleared: 9 × 75 = 675", () => {
    expect(
      teamPointsLeft(model, progress, {
        depth: 11,
        coveredObjectiveIndexes: [0],
      })
    ).toBe(675)
  })

  it("counts every award without progress: 141 + 133 = 274 over battles 1–2 with 20 + 25 covered", () => {
    const lane = {
      battleIds: ["b1", "b2"],
      battlesPoints: [32, 28],
      defeatAll: [32, 32],
      unitsRestrictions: [
        { ...lysanderEvent.alpha.unitsRestrictions[0]!, index: 0, points: 20 },
        { ...lysanderEvent.alpha.unitsRestrictions[1]!, index: 1, points: 25 },
      ],
    }
    expect(
      teamPointsLeft(buildLanePointsModel(lane), undefined, {
        depth: 2,
        coveredObjectiveIndexes: [0, 1],
      })
    ).toBe(274)
  })
})
