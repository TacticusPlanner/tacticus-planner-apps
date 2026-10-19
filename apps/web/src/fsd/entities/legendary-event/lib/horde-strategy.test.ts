import { describe, expect, it } from "vitest"

import {
  hordeStrategy,
  hordeSynergies,
  parseHordeStrategyText,
  withStrategyFallback,
} from "./horde-strategy"

const tierList = {
  tiers: [{ tier: "A", multiplier: 1.7 }],
  characters: [
    {
      unitId: "blackTerminator",
      tier: "A",
      synergies: ["deathRotbone", "blackTerminator", "worldTerminator"],
    },
    { unitId: "blackTerminator", tier: "A", synergies: ["blackAbaddon"] },
    { unitId: "ultraCalgar", tier: "A" },
  ],
}

describe("parseHordeStrategyText", () => {
  it("keeps only non-blank string fields", () => {
    expect(
      parseHordeStrategyText({
        strengths: "Strong",
        howToUse: " ",
        relicAdvice: 3,
        other: "ignored",
      })
    ).toEqual({ strengths: "Strong" })
    expect(parseHordeStrategyText(undefined)).toEqual({})
    expect(parseHordeStrategyText("text")).toEqual({})
  })
})

describe("withStrategyFallback", () => {
  it("takes each missing field from the fallback", () => {
    expect(
      withStrategyFallback(
        { strengths: "Stark" },
        { strengths: "Strong", howToUse: "Use" }
      )
    ).toEqual({ strengths: "Stark", howToUse: "Use" })
  })
})

describe("hordeSynergies", () => {
  it("serves the first entry's teammates in order, without the character itself", () => {
    expect(hordeSynergies(tierList, "blackTerminator")).toEqual([
      "deathRotbone",
      "worldTerminator",
    ])
  })

  it("is empty without synergies, entry or tier list", () => {
    expect(hordeSynergies(tierList, "ultraCalgar")).toEqual([])
    expect(hordeSynergies(tierList, "notListed")).toEqual([])
    expect(hordeSynergies(null, "blackTerminator")).toEqual([])
  })
})

describe("hordeStrategy", () => {
  it("is null with no text and no teammates", () => {
    expect(hordeStrategy({}, [])).toBeNull()
  })

  it("shows teammates alone, or text alone", () => {
    expect(hordeStrategy({}, ["deathRotbone"])).toEqual({
      teammates: ["deathRotbone"],
    })
    expect(hordeStrategy({ relicAdvice: "Relic" }, [])).toEqual({
      relicAdvice: "Relic",
      teammates: [],
    })
  })
})
