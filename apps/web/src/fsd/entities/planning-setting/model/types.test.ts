import { describe, expect, it } from "vitest"

import { defaultPlanningSettings, normalizeGoalsView } from "./types"

describe("normalizeGoalsView", () => {
  it.each([
    ["Cards", "Cards"],
    ["Table", "Table"],
    [undefined, "Cards"],
    [null, "Cards"],
    ["Grid", "Cards"],
    ["table", "Cards"],
  ] as const)("reads %s as %s", (stored, expected) => {
    expect(normalizeGoalsView(stored)).toBe(expected)
  })

  it("defaults new accounts to Cards", () => {
    expect(defaultPlanningSettings.goalsView).toBe("Cards")
  })
})
