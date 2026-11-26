import { describe, expect, it } from "vitest"

import type { TeamRosterUnit } from "@/entities/team"

import { capMarks } from "./cap-marks"

const unit = (overrides: Partial<TeamRosterUnit>): TeamRosterUnit => ({
  progression: "Rare:RedOneStar",
  rank: "Silver1",
  xpLevel: 26,
  abilityLevels: [26, 26],
  ...overrides,
})

describe("capMarks", () => {
  it("is over a Rare cap for a Mythic unit with maxed abilities", () => {
    expect(
      capMarks(
        unit({
          progression: "Mythic:OneBlueStar",
          rank: "Adamantine1",
          xpLevel: 55,
          abilityLevels: [55, 55],
        }),
        "Rare"
      )
    ).toEqual({ over: ["rarity", "rank", "level", "abilities"], under: [] })
  })

  it("is under a Rare cap for an Uncommon unit, or one with an ability below the Rare maximum", () => {
    expect(
      capMarks(
        unit({
          progression: "Uncommon:FourStars",
          rank: "Bronze1",
          xpLevel: 17,
          abilityLevels: [17, 17],
        }),
        "Rare"
      )
    ).toEqual({ over: [], under: ["rarity", "rank", "level", "abilities"] })
    expect(capMarks(unit({ abilityLevels: [26, 20] }), "Rare")).toEqual({
      over: [],
      under: ["abilities"],
    })
  })

  it("has no marks for a unit right at the cap, and none without a unit or a cap", () => {
    expect(capMarks(unit({}), "Rare")).toEqual({ over: [], under: [] })
    expect(capMarks(undefined, "Rare")).toBeNull()
    expect(capMarks(unit({}), undefined)).toBeNull()
  })
})
