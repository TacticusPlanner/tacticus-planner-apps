import { describe, expect, it } from "vitest"

import { goalTypeIcon } from "./goal-type-icon"

describe("goalTypeIcon", () => {
  it("returns the same icon for Rank and Upgrade goals", () => {
    expect(goalTypeIcon("Rank")).toBe(goalTypeIcon("Upgrade"))
  })

  it("picks a Mow-specific icon for Ability goals on a Mow entity", () => {
    expect(goalTypeIcon("Ability", "Mow")).not.toBe(
      goalTypeIcon("Ability", "Character")
    )
  })

  it("returns a distinct icon per other goal kind", () => {
    const kinds = ["Ascension", "Unlock", "UpgradeItem", "Level"] as const
    const icons = new Set(kinds.map((kind) => goalTypeIcon(kind)))
    expect(icons.size).toBe(kinds.length)
  })
})
