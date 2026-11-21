import { describe, expect, it } from "vitest"

import { allianceIcon, onslaughtAllianceIcon } from "./onslaught"

describe("allianceIcon", () => {
  it("returns the emblem for Imperial, Chaos and Xenos", () => {
    expect(allianceIcon("Chaos")).toBe(onslaughtAllianceIcon("Chaos"))
    expect(allianceIcon("Imperial")).toContain("ui_ability_badges_imperial")
  })

  it("returns undefined for Neutral, an unknown id or no alliance", () => {
    expect(allianceIcon("Neutral")).toBeUndefined()
    expect(allianceIcon("Tyranids")).toBeUndefined()
    expect(allianceIcon(null)).toBeUndefined()
    expect(allianceIcon(undefined)).toBeUndefined()
  })
})
