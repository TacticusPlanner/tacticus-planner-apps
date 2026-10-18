import { describe, expect, it } from "vitest"

import { buildTrackRoster } from "./track-roster"

const view = (alliance: "Imperial" | "Chaos", traits: string[]) => ({
  meleeDamage: "Power",
  rangedDamage: alliance === "Imperial" ? "Bolter" : null,
  traits,
  alliance,
})

describe("buildTrackRoster", () => {
  const catalog = new Map([
    ["ultraCalgar", view("Imperial", ["Terminator"])],
    ["worldKharn", view("Chaos", ["Resilient"])],
  ])
  const roster = [
    { unitId: "ultraCalgar" },
    { unitId: "worldKharn" },
    { unitId: "missingFromCatalog" },
  ]

  it("keeps the track's characters and offers only their traits and damage types", () => {
    const result = buildTrackRoster(roster, catalog, "Imperial")
    expect(result.trackRoster).toEqual([{ unitId: "ultraCalgar" }])
    expect(result.availableTraits).toEqual(["Terminator"])
    expect(result.availableDamageTypes).toEqual(["Bolter", "Power"])
    // The catalog map covers every owned character the catalog knows, whatever its track.
    expect([...result.rosterCatalog.keys()]).toEqual([
      "ultraCalgar",
      "worldKharn",
    ])
  })

  it("is empty until both the roster and the catalog are read", () => {
    for (const result of [
      buildTrackRoster(undefined, catalog, "Imperial"),
      buildTrackRoster(roster, undefined, "Imperial"),
    ]) {
      expect(result.trackRoster).toEqual([])
      expect(result.rosterCatalog.size).toBe(0)
    }
  })
})
