import { describe, expect, it } from "vitest"

import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { farsightEvent, lysanderEvent } from "@/test/fixtures/legendary-events"

import type { LegendaryEventUnitFilter } from "../model/types"
import { unitDealtDamageTypes } from "./damage-profile-exclusions"
import {
  isUnitAllowedOnLane,
  matchesObjectiveFilter,
  objectivesSatisfied,
} from "./objective-match"

const dante = fixtureCharacter("bloodDante")
const champion = fixtureCharacter("votanChampion")
const lysander = fixtureCharacter("astarLysander")
const sekhetar = fixtureCharacter("thousSekhetar")

const filter = (
  kind: string,
  target: string,
  exclude = false
): LegendaryEventUnitFilter => ({ kind, target, exclude })

describe("matchesObjectiveFilter", () => {
  it("matches Alliance and Faction by equality, inverted by exclude", () => {
    expect(matchesObjectiveFilter(dante, filter("Alliance", "Imperial"))).toBe(
      true
    )
    expect(matchesObjectiveFilter(dante, filter("Alliance", "Xenos"))).toBe(
      false
    )
    expect(
      matchesObjectiveFilter(dante, filter("Alliance", "Xenos", true))
    ).toBe(true)
    expect(
      matchesObjectiveFilter(dante, filter("Faction", "BloodAngels"))
    ).toBe(true)
    expect(
      matchesObjectiveFilter(dante, filter("Faction", "BloodAngels", true))
    ).toBe(false)
  })

  it("matches Trait against the catalog traits (No Resilient)", () => {
    const noResilient = filter("Trait", "Resilient", true)
    expect(lysander.traits).toContain("Resilient")
    expect(matchesObjectiveFilter(lysander, noResilient)).toBe(false)
    expect(matchesObjectiveFilter(dante, noResilient)).toBe(true)
    expect(matchesObjectiveFilter(dante, filter("Trait", "Flying"))).toBe(true)
  })

  it("matches DamageType through melee, ranged and ability damage", () => {
    // votanChampion: melee Eviscerate, ranged Bolter, abilities DirectDamage + Physical.
    expect(
      matchesObjectiveFilter(champion, filter("DamageType", "Eviscerate"))
    ).toBe(true)
    expect(
      matchesObjectiveFilter(champion, filter("DamageType", "Bolter"))
    ).toBe(true)
    expect(
      matchesObjectiveFilter(champion, filter("DamageType", "Physical"))
    ).toBe(true)
    // bloodDante: melee Piercing, ability Melta.
    expect(matchesObjectiveFilter(dante, filter("DamageType", "Melta"))).toBe(
      true
    )
    expect(
      matchesObjectiveFilter(dante, filter("DamageType", "Eviscerate"))
    ).toBe(false)
  })

  it("drops the damage-profile exclusions (DirectDamage on the Champion, Psychic on Sekhetar)", () => {
    expect(champion.activeAbilityDamage).toContain("DirectDamage")
    expect(unitDealtDamageTypes(champion)).not.toContain("DirectDamage")
    expect(
      matchesObjectiveFilter(champion, filter("DamageType", "DirectDamage"))
    ).toBe(false)
    expect(
      matchesObjectiveFilter(
        { ...sekhetar, passiveAbilityDamage: ["Psychic"] },
        filter("DamageType", "Psychic")
      )
    ).toBe(false)
    // Another unit with the same ability damage keeps it.
    expect(
      matchesObjectiveFilter(
        { ...dante, activeAbilityDamage: ["DirectDamage"] },
        filter("DamageType", "DirectDamage")
      )
    ).toBe(true)
  })

  it("counts ranged hits over melee hits for MinHits / MaxHits", () => {
    const min5 = filter("MinHits", "5")
    const max2 = filter("MaxHits", "2")
    // Champion: melee 2, ranged 2.
    expect(matchesObjectiveFilter(champion, max2)).toBe(true)
    expect(matchesObjectiveFilter(champion, min5)).toBe(false)
    // Dante: melee 4, no ranged attack.
    expect(matchesObjectiveFilter(dante, max2)).toBe(false)
    expect(matchesObjectiveFilter(dante, min5)).toBe(false)
    // Ranged hits win even when melee hits would pass.
    const rangedOne = { ...dante, meleeHits: 6, rangedHits: 1 }
    expect(matchesObjectiveFilter(rangedOne, min5)).toBe(false)
    expect(matchesObjectiveFilter(rangedOne, filter("MaxHits", "1"))).toBe(true)
  })

  it("matches AttackType Ranged, and Melee as excluded Ranged", () => {
    const melee = filter("AttackType", "Ranged", true)
    expect(matchesObjectiveFilter(dante, melee)).toBe(true)
    expect(matchesObjectiveFilter(champion, melee)).toBe(false)
    expect(
      matchesObjectiveFilter(champion, filter("AttackType", "Ranged"))
    ).toBe(true)
  })

  it("matches no unit for an unknown kind, even with exclude", () => {
    expect(matchesObjectiveFilter(dante, filter("NoSummons", ""))).toBe(false)
    expect(matchesObjectiveFilter(dante, filter("NoSummons", "", true))).toBe(
      false
    )
  })
})

describe("lane evaluation", () => {
  it("allows every non-Xenos unit on Lysander Alpha", () => {
    expect(isUnitAllowedOnLane(dante, lysanderEvent.alpha)).toBe(true)
    expect(
      isUnitAllowedOnLane(fixtureCharacter("tauFarsight"), lysanderEvent.alpha)
    ).toBe(false)
  })

  it("applies a faction exclusion on top of the alliance one (Farsight Gamma)", () => {
    const gamma = farsightEvent.gamma
    expect(isUnitAllowedOnLane(dante, gamma)).toBe(true)
    expect(isUnitAllowedOnLane(fixtureCharacter("tauFarsight"), gamma)).toBe(
      true
    )
    expect(isUnitAllowedOnLane(fixtureCharacter("orksWarboss"), gamma)).toBe(
      false
    )
    expect(isUnitAllowedOnLane(fixtureCharacter("blackAbaddon"), gamma)).toBe(
      false
    )
  })

  it("lists the satisfied objective indices in catalog order", () => {
    // Lysander Alpha: 0 Eviscerate, 1 Suppressive Fire, 2 Flying, 3 Min 5 hits, 4 No Resilient.
    expect(objectivesSatisfied(dante, lysanderEvent.alpha)).toEqual([2, 4])
    // Lysander is allowed but meets none of them.
    expect(objectivesSatisfied(lysander, lysanderEvent.alpha)).toEqual([])
    // The Champion (Xenos) would match Eviscerate and No Resilient, but the lane excludes Xenos.
    expect(
      matchesObjectiveFilter(
        champion,
        lysanderEvent.alpha.unitsRestrictions[0]!.filter
      )
    ).toBe(true)
    expect(objectivesSatisfied(champion, lysanderEvent.alpha)).toEqual([])
    expect(
      objectivesSatisfied(fixtureCharacter("tauFarsight"), lysanderEvent.alpha)
    ).toEqual([])
  })
})
