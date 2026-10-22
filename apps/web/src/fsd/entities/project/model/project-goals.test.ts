import { describe, expect, it } from "vitest"

import { projectGoals } from "./project-goals"

describe("projectGoals", () => {
  it("joins a project's goal ids against the map in the project's order, skipping absent ids", () => {
    const goalsById = new Map([
      ["a", { goalId: "a" }],
      ["b", { goalId: "b" }],
    ])

    expect(
      projectGoals({ goalIds: ["b", "archived", "a"] }, goalsById)
    ).toEqual([{ goalId: "b" }, { goalId: "a" }])
  })

  it("returns nothing for a project without members", () => {
    expect(projectGoals({ goalIds: [] }, new Map())).toEqual([])
  })
})
