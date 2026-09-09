import { describe, expect, it } from "vitest"

import {
  getStyleSpec,
  parseAbilityText,
  resolveI2p,
  resolveVariable,
  type AbilityContext,
  type StyledNode,
} from "./ability-text"

// Ported from V1 `3-features/character-details/ability-text.spec.ts` — the deterministic parser /
// resolver / i2p cases. The V1 data-sweep tests (over `new-ability-data.json`) live with the
// raid-boss text resolver instead, since that dataset is generated into an i18n namespace here.

describe("parseAbilityText", () => {
  it("parses plain text", () => {
    expect(parseAbilityText("Hello world")).toEqual([
      { type: "text", value: "Hello world" },
    ])
  })

  it("parses a simple styled span", () => {
    const ast = parseAbilityText('<style="Stat_Hits">3x</style>')
    expect(ast).toHaveLength(1)
    const node = ast[0] as StyledNode
    expect(node.type).toBe("styled")
    expect(node.styleName).toBe("Stat_Hits")
    expect(node.isDynamic).toBe(false)
    expect(node.children).toEqual([{ type: "text", value: "3x" }])
  })

  it("parses a variable", () => {
    const ast = parseAbilityText("{[nrOfHits]}")
    expect(ast[0]).toMatchObject({ type: "var", name: "nrOfHits" })
  })

  it("parses a split-indexed variable {[dmg[0]]}", () => {
    expect(parseAbilityText("{[dmg[0]]}")[0]).toMatchObject({
      type: "var",
      name: "dmg",
      splitIndex: 0,
    })
  })

  it("parses {[UnitName]}", () => {
    expect(parseAbilityText("{[UnitName]}")[0]).toMatchObject({
      type: "var",
      isUnitName: true,
    })
  })

  it("parses {[S/key]} as a skipped var with empty name", () => {
    expect(parseAbilityText("{[S/AbilityDamageExplanation]}")[0]).toMatchObject(
      {
        type: "var",
        name: "",
      }
    )
  })

  it("parses a dynamic style span", () => {
    const ast = parseAbilityText(
      "<style={[DamageProfileTypeStyle]}>Bolter Damage</style>"
    )
    const node = ast[0] as StyledNode
    expect(node.isDynamic).toBe(true)
    expect(node.styleName).toBe("[DamageProfileTypeStyle]")
  })

  it("parses nested styles", () => {
    const ast = parseAbilityText(
      '<style="Faction_Ultramarines">{[UnitName]}</style> deals <style="Stat_Hits">3x</style>'
    )
    expect(ast).toHaveLength(3)
    expect(ast[0].type).toBe("styled")
    expect(ast[2].type).toBe("styled")
  })

  it("throws on an unmatched closing tag", () => {
    expect(() => parseAbilityText("plain</style>")).toThrow()
  })
})

describe("resolveVariable", () => {
  const context: AbilityContext = {
    level: 1,
    variables: { dmg: ["100,80,60", "110,90,70"], hits: [3, 4] },
    constants: { damageProfile: "Bolter", nrOfHits: "1" },
    scaledVariableNames: new Set(["hits"]),
    rarity: "Common",
    unitName: "Marneus Calgar",
    factionId: "Ultramarines",
  }

  it("resolves a level-indexed variable at level 1 and 2", () => {
    expect(resolveVariable({ type: "var", name: "hits" }, context)).toBe("3")
    expect(
      resolveVariable({ type: "var", name: "hits" }, { ...context, level: 2 })
    ).toBe("4")
  })

  it("resolves a split-indexed variable", () => {
    expect(
      resolveVariable({ type: "var", name: "dmg", splitIndex: 1 }, context)
    ).toBe("80")
  })

  it("resolves a constant", () => {
    expect(resolveVariable({ type: "var", name: "nrOfHits" }, context)).toBe(
      "1"
    )
  })

  it("returns the unit name for isUnitName", () => {
    expect(
      resolveVariable(
        { type: "var", name: "UnitName", isUnitName: true },
        context
      )
    ).toBe("Marneus Calgar")
  })

  it("returns undefined for a skipped S/key var", () => {
    expect(resolveVariable({ type: "var", name: "" }, context)).toBeUndefined()
  })

  it("scales a variable by the rarity factor (Epic = 1.6)", () => {
    // hits[0] = 3, × 1.6 = 4.8 → 5
    expect(
      resolveVariable(
        { type: "var", name: "hits" },
        { ...context, rarity: "Epic" }
      )
    ).toBe("5")
  })

  it("does not scale variables outside scaledVariableNames", () => {
    expect(
      resolveVariable(
        { type: "var", name: "dmg", splitIndex: 0 },
        { ...context, rarity: "Epic" }
      )
    ).toBe("100")
  })

  it("falls back to the last level entry past the array end", () => {
    expect(
      resolveVariable({ type: "var", name: "hits" }, { ...context, level: 9 })
    ).toBe("4")
  })

  it("returns a {name} placeholder for an unknown variable", () => {
    expect(resolveVariable({ type: "var", name: "mystery" }, context)).toBe(
      "{mystery}"
    )
  })
})

describe("resolveI2p", () => {
  const variables = { extraHits: [1, 1, 2, 2, 3] }
  const pluralText =
    "[i2p_Plural]scores {[extraHits]} hits[i2p_One]scores {[extraHits]} hit"

  it("picks the singular section when the value is 1", () => {
    expect(resolveI2p(pluralText, 1, variables)).toBe(
      "scores {[extraHits]} hit"
    )
  })

  it("picks the plural section when the value is > 1", () => {
    expect(resolveI2p(pluralText, 3, variables)).toBe(
      "scores {[extraHits]} hits"
    )
  })

  it("returns the text unchanged with no i2p markers", () => {
    expect(resolveI2p("plain text", 1, variables)).toBe("plain text")
  })

  it("preserves the prefix before the first marker", () => {
    const withPrefix =
      "intro. [i2p_Plural]{[extraHits]} hits[i2p_One]{[extraHits]} hit"
    expect(resolveI2p(withPrefix, 1, variables)).toBe(
      "intro. {[extraHits]} hit"
    )
  })
})

describe("getStyleSpec", () => {
  it("colors a faction token", () => {
    expect(getStyleSpec("Faction_Ultramarines")?.color).toBe("#3A81E8")
  })

  it("colors a stat token", () => {
    expect(getStyleSpec("Stat_Damage")?.color).toBe("#2dd4bf")
  })

  it("underlines a damage-type token", () => {
    const spec = getStyleSpec("DMG_Psychic")
    expect(spec?.underline).toBe(true)
    expect(spec?.color).toBe("#d946ef")
  })

  it("returns a gradient for Rarity_Mythic", () => {
    expect(getStyleSpec("Rarity_Mythic")?.gradient).toBeTruthy()
  })

  it("returns undefined for an unknown style", () => {
    expect(getStyleSpec("NotARealStyle")).toBeUndefined()
  })
})
