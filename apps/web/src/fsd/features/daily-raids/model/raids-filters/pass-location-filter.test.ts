import { describe, expect, it } from "vitest"

import { passLocationFilter } from "./pass-location-filter"
import {
  countActiveFilterGroups,
  emptyRaidsFilters,
  type RaidsFilterBattle,
  type RaidsFilters,
} from "./raids-filters.domain"

// Mirrors V1 `upgrades.service.spec.ts` / `campaigns.service` filter cases (min/max count, enemy
// types, slots, campaign type, alliances/factions, combined) against the V2 battle shape.
const battle = (
  overrides: Partial<RaidsFilterBattle> = {}
): RaidsFilterBattle => ({
  slots: 5,
  alliesAlliance: "Imperial",
  alliesFactions: ["AdeptusAstartes", "Ultramarines"],
  enemiesAlliances: ["Xenos"],
  enemiesFactions: ["Orks"],
  enemiesTraits: ["Mechanical", "Flying"],
  enemiesTotal: 10,
  enemiesTypes: ["Grot", "Ork Boy"],
  campaignType: "Elite",
  ...overrides,
})
const filters = (overrides: Partial<RaidsFilters>): RaidsFilters => ({
  ...emptyRaidsFilters,
  ...overrides,
})

describe("passLocationFilter", () => {
  it("passes everything for an empty filter", () => {
    expect(passLocationFilter(battle(), emptyRaidsFilters)).toBe(true)
    expect(
      passLocationFilter(battle({ campaignType: null }), emptyRaidsFilters)
    ).toBe(true)
  })

  it("bounds the enemy count by min and max (inclusive)", () => {
    expect(
      passLocationFilter(
        battle({ enemiesTotal: 6 }),
        filters({ enemiesMin: 10 })
      )
    ).toBe(false)
    expect(
      passLocationFilter(
        battle({ enemiesTotal: 10 }),
        filters({ enemiesMin: 10 })
      )
    ).toBe(true)
    expect(
      passLocationFilter(
        battle({ enemiesTotal: 10 }),
        filters({ enemiesMax: 6 })
      )
    ).toBe(false)
    expect(
      passLocationFilter(
        battle({ enemiesTotal: 6 }),
        filters({ enemiesMax: 6 })
      )
    ).toBe(true)
  })

  it("passes when any enemy type is selected", () => {
    expect(
      passLocationFilter(battle(), filters({ enemiesTypes: ["Grot"] }))
    ).toBe(true)
    expect(
      passLocationFilter(
        battle(),
        filters({ enemiesTypes: ["Nurglings", "Grot"] })
      )
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ enemiesTypes: ["Nurglings"] }))
    ).toBe(false)
  })

  it("matches slots, defaulting an unknown count to 5", () => {
    expect(
      passLocationFilter(battle({ slots: 3 }), filters({ slots: [5] }))
    ).toBe(false)
    expect(
      passLocationFilter(battle({ slots: 3 }), filters({ slots: [3, 4] }))
    ).toBe(true)
    expect(
      passLocationFilter(battle({ slots: 0 }), filters({ slots: [5] }))
    ).toBe(true)
  })

  it("matches the campaign type option, failing a battle with none", () => {
    expect(
      passLocationFilter(
        battle(),
        filters({ campaignTypes: ["Elite", "Mirror"] })
      )
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ campaignTypes: ["Normal"] }))
    ).toBe(false)
    expect(
      passLocationFilter(
        battle({ campaignType: null }),
        filters({ campaignTypes: ["Early"] })
      )
    ).toBe(false)
  })

  it("matches allies from the battle's catalog fields", () => {
    expect(
      passLocationFilter(battle(), filters({ alliesAlliances: ["Chaos"] }))
    ).toBe(false)
    expect(
      passLocationFilter(battle(), filters({ alliesAlliances: ["Imperial"] }))
    ).toBe(true)
    expect(
      passLocationFilter(
        battle(),
        filters({ alliesFactions: ["Ultramarines"] })
      )
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ alliesFactions: ["Necrons"] }))
    ).toBe(false)
  })

  it("matches enemy alliances and factions", () => {
    expect(
      passLocationFilter(battle(), filters({ enemiesAlliances: ["Xenos"] }))
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ enemiesAlliances: ["Chaos"] }))
    ).toBe(false)
    expect(
      passLocationFilter(battle(), filters({ enemiesFactions: ["Orks"] }))
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ enemiesFactions: ["Necrons"] }))
    ).toBe(false)
  })

  it("passes when any enemy has any selected trait", () => {
    expect(
      passLocationFilter(battle(), filters({ enemiesTraits: ["Mechanical"] }))
    ).toBe(true)
    expect(
      passLocationFilter(
        battle(),
        filters({ enemiesTraits: ["Daemon", "Flying"] })
      )
    ).toBe(true)
    expect(
      passLocationFilter(battle(), filters({ enemiesTraits: ["Daemon"] }))
    ).toBe(false)
    expect(
      passLocationFilter(
        battle({ enemiesTraits: [] }),
        filters({ enemiesTraits: ["Mechanical"] })
      )
    ).toBe(false)
    expect(
      passLocationFilter(battle({ enemiesTraits: [] }), emptyRaidsFilters)
    ).toBe(true)
  })

  it("ANDs enemy traits with the other criteria", () => {
    const f = filters({
      enemiesTraits: ["Mechanical"],
      campaignTypes: ["Elite"],
    })
    expect(passLocationFilter(battle(), f)).toBe(true)
    expect(passLocationFilter(battle({ campaignType: "Mirror" }), f)).toBe(
      false
    )
  })

  it("ANDs combined criteria", () => {
    const combined = filters({
      enemiesAlliances: ["Xenos"],
      campaignTypes: ["Elite"],
      slots: [5],
      enemiesMin: 10,
      enemiesTypes: ["Grot"],
    })
    expect(passLocationFilter(battle(), combined)).toBe(true)
    expect(passLocationFilter(battle({ slots: 4 }), combined)).toBe(false)
    expect(passLocationFilter(battle({ enemiesTotal: 9 }), combined)).toBe(
      false
    )
    expect(
      passLocationFilter(battle({ campaignType: "Mirror" }), combined)
    ).toBe(false)
    expect(
      passLocationFilter(battle({ enemiesTypes: ["Ork Boy"] }), combined)
    ).toBe(false)
  })

  it("restricts only upgrade materials by rarity", () => {
    const legendary = filters({ upgradeRarities: ["Legendary"] })
    expect(passLocationFilter(battle(), legendary, { rarity: "Common" })).toBe(
      false
    )
    expect(
      passLocationFilter(battle(), legendary, { rarity: "Legendary" })
    ).toBe(true)
    // A shard material (no upgrade record) and a material-less evaluation skip the rarity criterion.
    expect(passLocationFilter(battle(), legendary)).toBe(true)
    expect(
      passLocationFilter(
        battle({ slots: 3 }),
        filters({ upgradeRarities: ["Legendary"], slots: [5] })
      )
    ).toBe(false)
  })
})

describe("countActiveFilterGroups", () => {
  it("counts each of the eleven fields once", () => {
    expect(countActiveFilterGroups(emptyRaidsFilters)).toBe(0)
    expect(
      countActiveFilterGroups(
        filters({
          alliesFactions: ["Orks", "Necrons"],
          enemiesTypes: ["Grot"],
          enemiesMin: 3,
        })
      )
    ).toBe(3)
    expect(
      countActiveFilterGroups({
        alliesAlliances: ["Imperial"],
        alliesFactions: ["Orks"],
        enemiesAlliances: ["Xenos"],
        enemiesFactions: ["Orks"],
        enemiesTraits: ["Mechanical"],
        campaignTypes: ["Elite"],
        upgradeRarities: ["Common"],
        slots: [5],
        enemiesTypes: ["Grot"],
        enemiesMin: 0,
        enemiesMax: 20,
      })
    ).toBe(11)
  })

  it("counts several enemy traits as one group", () => {
    expect(
      countActiveFilterGroups(
        filters({ enemiesTraits: ["Mechanical", "Daemon"] })
      )
    ).toBe(1)
  })
})
