import { describe, expect, it } from "vitest"

import type { LegendaryEventAnnotation } from "../model/plan.types"
import type { LegendaryEventLaneRecord } from "../model/types"
import {
  annotationCellKey,
  applicableAnnotations,
} from "./applicable-annotations"

const mark = (
  battleIndex: number,
  objectiveId: number,
  status: LegendaryEventAnnotation["status"] = "maybeClear",
  laneId: LegendaryEventAnnotation["laneId"] = "alpha"
): LegendaryEventAnnotation => ({
  laneId,
  battleIndex,
  objectiveId,
  status,
  updatedAt: "2026-10-10T00:00:00Z",
})

const lane = (cleared: number[][]) =>
  ({
    encounters: cleared.map((objectivesCleared) => ({
      objectivesCleared,
      highScore: 0,
      encounterPoints: 0,
    })),
  }) as unknown as LegendaryEventLaneRecord

describe("applicableAnnotations", () => {
  it("keeps a mark on a not-cleared cell", () => {
    const stopHere = mark(0, 3, "stopHere")
    expect(applicableAnnotations([stopHere], "alpha", lane([[0, 2]]))).toEqual([
      stopHere,
    ])
  })

  it("drops a mark whose cell sync shows cleared", () => {
    expect(
      applicableAnnotations([mark(0, 2)], "alpha", lane([[0, 2]]))
    ).toEqual([])
  })

  it("leaves a complete battle with no marks", () => {
    const marks = [0, 1, 2, 3, 4, 5].map((id) => mark(3, id))
    expect(
      applicableAnnotations(
        marks,
        "alpha",
        lane([[], [], [], [0, 1, 2, 3, 4, 5]])
      )
    ).toEqual([])
  })

  it("keeps a mark on a battle beyond the synced encounters", () => {
    const later = mark(10, 0)
    expect(applicableAnnotations([later], "alpha", lane([[0]]))).toEqual([
      later,
    ])
  })

  it("has no marks on a lane with no synced record, and ignores other lanes", () => {
    expect(applicableAnnotations([mark(0, 1)], "alpha", undefined)).toEqual([])
    expect(applicableAnnotations([mark(0, 1)], "alpha", null)).toEqual([])
    expect(
      applicableAnnotations(
        [mark(0, 1, "maybeClear", "beta")],
        "alpha",
        lane([[]])
      )
    ).toEqual([])
    expect(applicableAnnotations(undefined, "alpha", lane([[]]))).toEqual([])
  })

  it("keys a cell by battle and objective", () => {
    expect(annotationCellKey(6, 3)).toBe("6:3")
  })
})
