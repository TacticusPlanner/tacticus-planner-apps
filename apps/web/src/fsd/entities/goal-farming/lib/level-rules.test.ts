import { describe, expect, it } from "vitest"
import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import { toLevelRules } from "./level-rules"

describe("toLevelRules", () => {
  const rules = toLevelRules([progressionRulesFixture])

  it("prefixes the XP curve with level 1's zero", () => {
    expect(rules?.xpTotalAtLevel.slice(0, 3)).toEqual([0, 25, 60])
    expect(rules?.xpTotalAtLevel[41]).toBe(809_200)
  })

  it("keys the XP books by rarity", () => {
    expect(rules?.xpBooks.Legendary).toEqual({
      id: "xpLegendary",
      xp: 12_500,
      gold: 500,
    })
  })

  it("takes each rank's level from its lowest upgrade slot", () => {
    // The same table V1 kept by hand (`rankToLevel`).
    expect(rules?.rankToLevel).toEqual({
      Stone1: 1,
      Stone2: 3,
      Stone3: 5,
      Iron1: 8,
      Iron2: 11,
      Iron3: 14,
      Bronze1: 17,
      Bronze2: 20,
      Bronze3: 23,
      Silver1: 26,
      Silver2: 29,
      Silver3: 32,
      Gold1: 35,
      Gold2: 38,
      Gold3: 41,
      Diamond1: 44,
      Diamond2: 47,
      Diamond3: 50,
      Adamantine1: 55,
      Adamantine2: 60,
    })
  })

  it("is undefined until the dataset is served", () => {
    expect(toLevelRules([])).toBeUndefined()
  })

  it("is undefined when a rarity has no book", () => {
    expect(
      toLevelRules([
        {
          ...progressionRulesFixture,
          xpBooks: progressionRulesFixture.xpBooks.slice(1),
        },
      ])
    ).toBeUndefined()
  })
})
