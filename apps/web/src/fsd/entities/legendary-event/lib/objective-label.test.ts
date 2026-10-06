import { describe, expect, it } from "vitest"

import { describeUnitFilter } from "./objective-label"

const filter = (kind: string, target: string, exclude = false) => ({
  kind,
  target,
  exclude,
})

describe("describeUnitFilter", () => {
  it("labels traits, damage types and factions from their namespaces with their icons", () => {
    expect(describeUnitFilter(filter("Trait", "Resilient", true))).toEqual({
      label: { type: "entry", key: "traits:Resilient", negate: true },
      icon: {
        type: "image",
        src: expect.stringContaining("ui_icon_trait_resilient_01.png"),
      },
    })
    expect(describeUnitFilter(filter("DamageType", "Eviscerate"))).toEqual({
      label: { type: "entry", key: "damageTypes:Eviscerate", negate: false },
      icon: {
        type: "image",
        src: expect.stringContaining("ui_icon_damage_profile2_Eviscerate.png"),
      },
    })
    expect(describeUnitFilter(filter("Faction", "Orks"))).toEqual({
      label: { type: "entry", key: "factions:Orks", negate: false },
      icon: {
        type: "image",
        src: expect.stringContaining("factions/Orks.png"),
      },
    })
  })

  it("labels alliances from common without an icon", () => {
    expect(describeUnitFilter(filter("Alliance", "Xenos", true))).toEqual({
      label: { type: "entry", key: "common:alliances.Xenos", negate: true },
      icon: undefined,
    })
  })

  it("uses the hits templates with the count", () => {
    expect(describeUnitFilter(filter("MinHits", "5"))).toEqual({
      label: { type: "hits", template: "minHits", count: 5 },
      icon: { type: "glyph", glyph: "hits" },
    })
    expect(describeUnitFilter(filter("MaxHits", "1")).label).toEqual({
      type: "hits",
      template: "maxHits",
      count: 1,
    })
  })

  it("reads attack type as Ranged, and excluded Ranged as Melee", () => {
    expect(describeUnitFilter(filter("AttackType", "Ranged"))).toEqual({
      label: { type: "attackType", template: "ranged" },
      icon: { type: "glyph", glyph: "ranged" },
    })
    expect(describeUnitFilter(filter("AttackType", "Ranged", true))).toEqual({
      label: { type: "attackType", template: "melee" },
      icon: { type: "glyph", glyph: "melee" },
    })
  })

  it("falls back to the catalog name for an unknown kind", () => {
    expect(describeUnitFilter(filter("Mystery", "X"))).toEqual({
      label: { type: "name" },
      icon: undefined,
    })
  })
})
