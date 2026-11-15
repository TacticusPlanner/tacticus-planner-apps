import { describe, expect, it } from "vitest"

import type { FilteredOutNeed } from "@/entities/goal-farming"

import { groupFilteredOutByMaterial } from "./filtered-out-materials"

const need = (
  goalId: string,
  resourceId: string,
  pinned = false
): FilteredOutNeed => ({
  goalId,
  resourceId: resourceId as FilteredOutNeed["resourceId"],
  remaining: 1,
  pinned,
})

describe("groupFilteredOutByMaterial", () => {
  it("returns nothing when no need was filtered out", () => {
    expect(groupFilteredOutByMaterial([])).toEqual([])
  })

  it("groups needs per material in first-reported order, each goal once", () => {
    expect(
      groupFilteredOutByMaterial([
        need("g1", "U1"),
        need("g1", "U2"),
        need("g2", "U1"),
        need("g1", "U1"),
      ])
    ).toEqual([
      { resourceId: "U1", goalIds: ["g1", "g2"], pinned: false },
      { resourceId: "U2", goalIds: ["g1"], pinned: false },
    ])
  })

  it("marks a material pinned when any goal pinned it to an excluded location", () => {
    expect(
      groupFilteredOutByMaterial([need("g1", "U1"), need("g2", "U1", true)])
    ).toEqual([{ resourceId: "U1", goalIds: ["g1", "g2"], pinned: true }])
  })
})
