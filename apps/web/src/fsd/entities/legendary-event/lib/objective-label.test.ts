import { describe, expect, it } from "vitest"

import { defeatAllIcon, describeUnitFilter } from "./objective-label"

const filter = (kind: string, target: string, exclude = false) => ({
  kind,
  target,
  exclude,
})

describe("describeUnitFilter", () => {
  it("labels traits, damage types and factions from their namespaces with their icons", () => {
    expect(describeUnitFilter(filter("Trait", "Flying"))).toEqual({
      label: { type: "entry", key: "traits:Flying", negate: false },
      icon: { src: expect.stringContaining("ui_icon_trait_flying_01.png") },
    })
    expect(describeUnitFilter(filter("DamageType", "Eviscerate"))).toEqual({
      label: { type: "entry", key: "damageTypes:Eviscerate", negate: false },
      icon: {
        src: expect.stringContaining("ui_icon_damage_profile2_Eviscerate.png"),
      },
    })
    expect(describeUnitFilter(filter("Faction", "Orks"))).toEqual({
      label: { type: "entry", key: "factions:Orks", negate: false },
      icon: { src: expect.stringContaining("factions/Orks.png") },
    })
  })

  it("badges a negated trait with the red X", () => {
    expect(describeUnitFilter(filter("Trait", "Resilient", true))).toEqual({
      label: { type: "entry", key: "traits:Resilient", negate: true },
      icon: {
        src: expect.stringContaining("ui_icon_trait_resilient_01.png"),
        badge: "not",
      },
    })
    expect(
      describeUnitFilter(filter("DamageType", "Bolter", true)).icon
    ).toEqual({ src: expect.stringContaining("Bolter"), badge: "not" })
  })

  it("labels alliances from common without an icon", () => {
    expect(describeUnitFilter(filter("Alliance", "Xenos", true))).toEqual({
      label: { type: "entry", key: "common:alliances.Xenos", negate: true },
      icon: undefined,
    })
  })

  it("uses the hits templates with the count and the hits asset with a bound badge", () => {
    expect(describeUnitFilter(filter("MinHits", "5"))).toEqual({
      label: { type: "hits", template: "minHits", count: 5 },
      icon: { src: expect.stringContaining("stat-hit"), badge: "min" },
    })
    expect(describeUnitFilter(filter("MaxHits", "1"))).toEqual({
      label: { type: "hits", template: "maxHits", count: 1 },
      icon: { src: expect.stringContaining("stat-hit"), badge: "max" },
    })
  })

  it("reads attack type as Ranged, and excluded Ranged as Melee, with the stat assets", () => {
    expect(describeUnitFilter(filter("AttackType", "Ranged"))).toEqual({
      label: { type: "attackType", template: "ranged" },
      icon: { src: expect.stringContaining("stat-ranged") },
    })
    expect(describeUnitFilter(filter("AttackType", "Ranged", true))).toEqual({
      label: { type: "attackType", template: "melee" },
      icon: { src: expect.stringContaining("stat-melee") },
    })
  })

  it("falls back to the catalog name for an unknown kind", () => {
    expect(describeUnitFilter(filter("Mystery", "X"))).toEqual({
      label: { type: "name" },
      icon: undefined,
    })
  })

  it("ships the defeat-all asset", () => {
    expect(defeatAllIcon).toContain("defeat-all")
  })
})
