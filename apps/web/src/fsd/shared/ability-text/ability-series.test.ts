import { describe, expect, it } from "vitest"

import { buildAbilitySeries, chartedSeries } from "./ability-series"
import { parseAbilityText, resolveVariable } from "./ability-text"
import type { AbilityTextEntry } from "./use-ability-text"
import { enNpcAbilityText as texts } from "@/test/rules-text"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`missing index ${index}`)
  return value
}

function text(key: string): AbilityTextEntry {
  const entry = texts[key]
  if (!entry) throw new Error(`missing ability text ${key}`)
  return entry
}

const stormOfWrath = text("StormOfWrath")

describe("buildAbilitySeries", () => {
  it("turns a {min}-{max} pair into one range series and keeps other values", () => {
    const series = buildAbilitySeries(stormOfWrath, "Mythic")

    expect(series.map((entry) => entry.names)).toEqual([
      ["minDmg", "maxDmg"],
      ["maxAdjacentTargets"],
    ])
    expect(at(series, 0).label).toBe("Psychic Damage")
    expect(at(series, 0).values).toHaveLength(60)
    expect(at(series, 0).values[0]).toHaveLength(2)
    expect(at(series, 1).values[0]).toHaveLength(1)
  })

  it("titles a value by the words after it, else the words before it", () => {
    const psychicFortress = text("PsychicFortress")
    expect(
      buildAbilitySeries(psychicFortress, "Mythic").map((entry) => [
        entry.names[0],
        entry.label,
      ])
    ).toEqual([
      // blockChance is a constant of the text, not a per-level value, so it has no series.
      ["blockDmg", "Damage"],
      ["dmgReduction", "Incoming Psychic Damage"],
    ])
    expect(at(buildAbilitySeries(stormOfWrath, "Mythic"), 1).label).toBe(
      "Adjacent units"
    )
  })

  it("scales values exactly as the rendered rules text does", () => {
    const series = buildAbilitySeries(stormOfWrath, "Legendary")
    const minDmg = parseAbilityText("{[minDmg]}")[0]
    if (minDmg?.type !== "var") throw new Error("expected a variable")

    for (const level of [1, 30, 60]) {
      const rendered = resolveVariable(minDmg, {
        level,
        variables: stormOfWrath.variables,
        constants: stormOfWrath.constants,
        scaledVariableNames: new Set(stormOfWrath.scaled),
        rarity: "Legendary",
        unitName: "Tigurius",
        factionId: "Ultramarines",
      })
      expect(at(at(series, 0).values, level - 1)[0]).toBe(Number(rendered))
    }
    // Rarity scaling applies: Mythic (×2) is above Legendary (×1.8).
    expect(
      at(at(buildAbilitySeries(stormOfWrath, "Mythic"), 0).values, 59)[0]
    ).toBeGreaterThan(at(at(at(series, 0).values, 59), 0))
  })

  it("flags a value that is the same at every level as constant", () => {
    const entry: AbilityTextEntry = {
      description: "Deals {[dmg]} damage and shares {[share]}% of it.",
      variables: {
        dmg: Array.from({ length: 65 }, (_, index) => index + 1),
        share: Array.from({ length: 65 }, () => 120),
      },
      constants: {},
      scaled: [],
    }
    const series = buildAbilitySeries(entry, "Common")

    expect(series.map((value) => [value.names[0], value.constant])).toEqual([
      ["dmg", false],
      ["share", true],
    ])
    expect(chartedSeries(series).map((value) => value.names[0])).toEqual([
      "dmg",
    ])
  })

  it("charts at most the first two changing values", () => {
    const rising = Array.from({ length: 65 }, (_, index) => index + 1)
    const entry: AbilityTextEntry = {
      description: "{[a]} then {[b]} then {[c]}.",
      variables: { a: rising, b: rising, c: rising },
      constants: {},
      scaled: [],
    }
    expect(
      chartedSeries(buildAbilitySeries(entry, "Common")).map(
        (value) => value.names[0]
      )
    ).toEqual(["a", "b"])
  })

  it("leaves out values that aren't numbers", () => {
    const entry: AbilityTextEntry = {
      description: "Summons a {[unitType]} with {[hp]} health.",
      variables: {
        unitType: Array.from({ length: 65 }, () => "Servitor"),
        hp: Array.from({ length: 65 }, (_, index) => index + 1),
      },
      constants: {},
      scaled: [],
    }
    expect(
      buildAbilitySeries(entry, "Common").map((value) => value.names)
    ).toEqual([["hp"]])
  })
})
