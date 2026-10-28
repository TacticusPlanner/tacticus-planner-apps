import { describe, expect, it } from "vitest"

import { goalTypeIcon } from "./goal-type-icon"

describe("goalTypeIcon", () => {
  it("shows a rank badge for Rank goals", () => {
    expect(goalTypeIcon("Rank")).toMatch(/\/fonts\/Rank_\d+\.webp$/)
  })

  it("picks a Mow-specific icon for Ability goals on a Mow entity", () => {
    expect(goalTypeIcon("Ability", "Mow")).not.toBe(
      goalTypeIcon("Ability", "Character")
    )
  })

  it("returns a distinct icon per other goal kind", () => {
    const kinds = ["Rank", "Ascension", "Unlock", "Upgrade"] as const
    const icons = new Set(kinds.map((kind) => goalTypeIcon(kind)))
    expect(icons.size).toBe(kinds.length)
  })
})
