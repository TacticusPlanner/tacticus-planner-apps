import { describe, expect, it } from "vitest"

import { hintLookup, objectiveHint } from "./hre-objective-hint"

const hints: Record<string, string> = {
  DealDamageOfProfileType_description: "Generic damage hint.",
  DealDamageOfProfileType_Psychic_description: "Psychic hint.",
  SlayEnemiesWithFactionTrait_description:
    'Deploy {[FACTION_TRAIT]} <style="Character">Characters</style>, {[UNKNOWN]}.',
}
const lookup = (key: string) => hints[key]

describe("objectiveHint", () => {
  it("uses the first hint key that has a hint", () => {
    const objective = {
      kind: "damageType" as const,
      target: 7500,
      qualifier: "Psychic",
      hintKeys: [
        "DealDamageOfProfileType_Psychic_v2",
        "DealDamageOfProfileType_Psychic_description",
        "DealDamageOfProfileType_description",
      ],
    }
    expect(objectiveHint(objective, lookup, {})).toBe("Psychic hint.")
  })

  it("fills known placeholders and keeps markup and unknown ones", () => {
    const objective = {
      kind: "killWithAlliance" as const,
      target: 10,
      hintKeys: ["SlayEnemiesWithFactionTrait_description"],
    }
    expect(objectiveHint(objective, lookup, { FACTION_TRAIT: "Chaos" })).toBe(
      'Deploy Chaos <style="Character">Characters</style>, {[UNKNOWN]}.'
    )
  })

  it("is undefined without a hint", () => {
    expect(
      objectiveHint({ kind: "killEnemies", target: 5 }, lookup, {})
    ).toBeUndefined()
    expect(
      objectiveHint(
        {
          kind: "killEnemies",
          target: 5,
          hintKeys: ["SlayEnemies_description"],
        },
        lookup,
        {}
      )
    ).toBeUndefined()
  })
})

describe("hintLookup", () => {
  const resources: Record<string, Record<string, string>> = {
    en: { A: "English A {[TARGET_AMOUNT]}", B: "English B" },
    es: { A: "Español A {[TARGET_AMOUNT]}" },
  }
  const getResource = (language: string, key: string) =>
    resources[language]?.[key]

  it("finds a region locale's language hints, then English", () => {
    const lookup = hintLookup(["es-ES", "es", "en"], getResource)
    expect(lookup("A")).toBe("Español A {[TARGET_AMOUNT]}")
    expect(lookup("B")).toBe("English B")
    expect(lookup("C")).toBeUndefined()
  })

  it("feeds objectiveHint, which still fills the placeholders", () => {
    const objective = {
      kind: "campaignWins" as const,
      target: 100,
      hintKeys: ["A"],
    }
    const lookup = hintLookup(["es-ES", "es"], getResource)
    expect(objectiveHint(objective, lookup, { TARGET_AMOUNT: "100" })).toBe(
      "Español A 100"
    )
  })
})
