import { describe, expect, it } from "vitest"

import { projectPortraitUnits } from "./project-unit-portraits"

const goal = (
  entityId: string,
  globalPriority: number | null,
  status = "Active"
) => ({ entityType: "Character", entityId, status, globalPriority })

describe("projectPortraitUnits", () => {
  it("takes the first 4 distinct units by the priority of their highest goal", () => {
    const goals = [
      goal("angrax", 9),
      goal("typhus", 4),
      goal("kharn", 1),
      goal("lucius", 6),
      goal("abaddon", 2),
      goal("kharn", 3),
      goal("ahriman", 8),
    ]

    expect(projectPortraitUnits(goals).map((unit) => unit.entityId)).toEqual([
      "kharn",
      "abaddon",
      "typhus",
      "lucius",
    ])
  })

  it("counts Paused goals and leaves out Completed ones", () => {
    const goals = [
      goal("kharn", null, "Completed"),
      goal("abaddon", 2, "Paused"),
    ]

    expect(projectPortraitUnits(goals)).toEqual([
      { entityType: "Character", entityId: "abaddon" },
    ])
  })

  it("keeps a Character and a MoW with the same id apart", () => {
    const goals = [
      goal("x", 1),
      { entityType: "Mow", entityId: "x", status: "Active", globalPriority: 2 },
    ]

    expect(projectPortraitUnits(goals)).toHaveLength(2)
  })

  it("is empty for a project without in-flight goals", () => {
    expect(projectPortraitUnits([])).toEqual([])
  })
})
