import { describe, expect, it } from "vitest"

import { hseTextIcon } from "./hse-text-icon"

describe("hseTextIcon", () => {
  it("finds the icon of a faction, trait, alliance or token mode label", () => {
    expect(hseTextIcon("factions:WorldEaters")).toContain("ui_icon_faction_")
    expect(hseTextIcon("traits:Psyker")).toContain("ui_icon_trait_psychic_01")
    expect(hseTextIcon("common:alliances.Chaos")).toBeDefined()
    expect(hseTextIcon("dailies:hse.details.modes.Onslaught")).toBeDefined()
  })

  it("has none for other labels", () => {
    expect(hseTextIcon("dailies:hse.details.modes.Campaign")).toBeUndefined()
    expect(hseTextIcon("common:alliances.Tyranids")).toBeUndefined()
    expect(hseTextIcon("dailies:hse.details.phrase.enemy")).toBeUndefined()
  })
})
