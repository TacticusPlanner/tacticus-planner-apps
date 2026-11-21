import { describe, expect, it } from "vitest"

import { rationaleIcon } from "./rationale-icon"

describe("rationaleIcon", () => {
  it("leads an event unit with what it matched", () => {
    expect(
      rationaleIcon({
        kind: "event-unit",
        match: { via: "trait", id: "Psyker" },
      })
    ).toContain("ui_icon_trait_psychic_01")
    expect(
      rationaleIcon({
        kind: "event-unit",
        match: { via: "alliance", id: "Chaos" },
      })
    ).toBeDefined()
    expect(
      rationaleIcon({
        kind: "event-unit",
        match: { via: "faction", id: "WorldEaters" },
      })
    ).toContain("ui_icon_faction_")
  })

  it("leads combat strength with power", () => {
    expect(rationaleIcon({ kind: "strength", combatPower: 1200 })).toContain(
      "power_level"
    )
  })

  it("has no icon for the other reasons", () => {
    expect(rationaleIcon({ kind: "event-unit" })).toBeUndefined()
    expect(rationaleIcon({ kind: "random" })).toBeUndefined()
    expect(rationaleIcon({ kind: "goal", goalId: "g1" })).toBeUndefined()
  })
})
