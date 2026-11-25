import { describe, expect, it } from "vitest"

import { objectiveIcon as objectiveIconSpec } from "./quest-objectives"

const objectiveIcon = (objective: { type: string; target?: string | null }) =>
  objectiveIconSpec(objective)?.src
const badgeOf = (objective: { type: string; target?: string | null }) =>
  objectiveIconSpec(objective)?.badge

describe("objectiveIcon", () => {
  it("names the trait, faction or damage type an objective targets", () => {
    expect(objectiveIcon({ type: "NotTrait", target: "Flying" })).toContain(
      "ui_icon_trait_flying_01"
    )
    // Quest data calls Beast Snagga "BeastSlayer"; the alias reaches the catalog's trait icon.
    expect(
      objectiveIcon({ type: "NotTrait", target: "BeastSlayer" })
    ).toContain("ui_icon_trait_beast_slayer_01")
    expect(
      objectiveIcon({ type: "NotFaction", target: "Ultramarines" })
    ).toContain("ui_icon_faction_")
    expect(objectiveIcon({ type: "NotDamageType", target: "Chain" })).toContain(
      "ui_icon_damage_profile2_Chain"
    )
    expect(objectiveIcon({ type: "DamageType", target: "Psychic" })).toContain(
      "ui_icon_damage_profile2_Psychic"
    )
  })

  it("uses the hits, ranged, summon and heal glyphs for the other restrictions", () => {
    expect(objectiveIcon({ type: "MaxHits", target: "3" })).toContain(
      "ui_icon_stat_hit_01"
    )
    expect(objectiveIcon({ type: "MinHits", target: "4" })).toContain(
      "ui_icon_stat_hit_01"
    )
    expect(objectiveIcon({ type: "HasRangedAttack" })).toContain(
      "ui_icon_stat_rangedattack_01"
    )
    expect(objectiveIcon({ type: "UseNoSummons" })).toContain("summon")
    expect(objectiveIcon({ type: "DoNoHealOrRepair" })).toContain("healer")
  })

  it("has no icon for objectives without a subject or with an unknown type", () => {
    expect(objectiveIcon({ type: "NoDamageTakenByAnyHero" })).toBeUndefined()
    expect(objectiveIcon({ type: "NotTrait", target: null })).toBeUndefined()
    expect(objectiveIcon({ type: "Acing" })).toBeUndefined()
  })

  it("badges a negated subject with a red X and a hits bound with ≤ or ≥, as Legendary Events do", () => {
    for (const type of ["NotTrait", "NotFaction", "NotDamageType"]) {
      expect(badgeOf({ type, target: "Ultramarines" })).toBe("not")
    }
    expect(badgeOf({ type: "UseNoSummons" })).toBe("not")
    expect(badgeOf({ type: "DoNoHealOrRepair" })).toBe("not")
    expect(badgeOf({ type: "MaxHits", target: "3" })).toBe("max")
    expect(badgeOf({ type: "MinHits", target: "4" })).toBe("min")
    expect(badgeOf({ type: "DamageType", target: "Psychic" })).toBeUndefined()
    expect(badgeOf({ type: "HasRangedAttack" })).toBeUndefined()
  })
})
