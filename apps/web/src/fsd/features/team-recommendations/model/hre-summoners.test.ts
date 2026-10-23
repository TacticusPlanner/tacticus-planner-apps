import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import abilityText from "../../../../../public/locales/en/npcAbilityText.json"
import { abilitySummons, buildSummonerIds } from "./hre-summoners"

const text = abilityText as Record<string, { description?: string }>
const descriptionOf = (id: string) => text[id]?.description

describe("summoners", () => {
  it("finds the abilities that bring a unit onto the battlefield", () => {
    for (const id of [
      "AberrantHypermorph",
      "GrotTank",
      "SupremeCommander",
      "SwornProtector",
      "Poxwalkers",
    ]) {
      expect(abilitySummons(descriptionOf(id) ?? ""), id).toBe(true)
    }
  })

  it("skips abilities that only buff or target existing summons", () => {
    for (const id of [
      "AmuletOfTheVoidwyrm",
      "MawClawsOfThyrax",
      "ShockAssault",
    ]) {
      expect(abilitySummons(descriptionOf(id) ?? ""), id).toBe(false)
    }
  })

  it("puts Hollan in the set and leaves a non-summoner out", () => {
    const summoners = buildSummonerIds(
      [
        {
          id: "genesBiophagus" as UnitId,
          activeAbilityNames: ["AberrantHypermorph"],
          passiveAbilityNames: [],
        },
        {
          id: "ultraInceptorSgt" as UnitId,
          activeAbilityNames: ["DeathFromAbove"],
          passiveAbilityNames: ["ShockAssault"],
        },
        {
          id: "someone" as UnitId,
          activeAbilityNames: ["NoSuchAbility"],
          passiveAbilityNames: ["ShockAssault"],
        },
      ],
      descriptionOf
    )
    expect([...summoners].sort()).toEqual([
      "genesBiophagus",
      "ultraInceptorSgt",
    ])
  })
})
