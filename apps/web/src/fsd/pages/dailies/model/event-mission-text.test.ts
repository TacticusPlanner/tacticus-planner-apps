import { describe, expect, it } from "vitest"

import { fillGameText, ladderView, sumRewards } from "./event-mission-text"

describe("fillGameText", () => {
  it("fills the target", () => {
    expect(
      fillGameText("Traverse {[TARGET_AMOUNT]} hexes with your characters", {
        TARGET_AMOUNT: "150",
      })
    ).toBe("Traverse 150 hexes with your characters")
  })

  it("picks the plural form and drops style tags", () => {
    const template =
      '[i2p_Plural]Play {[TARGET_AMOUNT]} {[GAME_MODE]} battles[i2p_One]Play {[TARGET_AMOUNT]} {[GAME_MODE]} battle<style="X">!</style>'
    expect(
      fillGameText(
        template,
        { TARGET_AMOUNT: 10, GAME_MODE: "any Campaign" },
        10
      )
    ).toBe("Play 10 any Campaign battles")
    expect(
      fillGameText(template, { TARGET_AMOUNT: 1, GAME_MODE: "Arena" }, 1)
    ).toBe("Play 1 Arena battle!")
  })

  it("keeps a placeholder it has no value for", () => {
    expect(fillGameText("Defeat {[FACTION_TRAIT]} enemies", {})).toBe(
      "Defeat {[FACTION_TRAIT]} enemies"
    )
  })

  it("fills a chain position", () => {
    expect(
      fillGameText("TRENCH FIGHTERS – {[CHAIN_POSITION]}/{[CHAIN_LENGTH]}", {
        CHAIN_POSITION: 3,
        CHAIN_LENGTH: 20,
      })
    ).toBe("TRENCH FIGHTERS – 3/20")
  })
})

describe("sumRewards", () => {
  it("adds the rewards of a chain up per type", () => {
    expect(
      sumRewards([
        { rewards: [{ type: "xp_seasonal", min: 90, max: 90 }] },
        {
          rewards: [
            { type: "xp_seasonal", min: 90, max: 90 },
            { type: "seasonalEventCurrencyOctober2026", min: 50, max: 50 },
          ],
        },
      ])
    ).toEqual([
      { type: "xp_seasonal", min: 180, max: 180 },
      { type: "seasonalEventCurrencyOctober2026", min: 50, max: 50 },
    ])
  })
})

describe("ladderView", () => {
  const currency = "seasonalEventCurrencyOctober2026"
  const tier = (
    requiredProgress: number,
    ...rewards: [string, number, number][]
  ) => ({
    requiredProgress,
    rewards: rewards.map(([type, min, max]) => ({ type, min, max })),
  })

  it("totals the event currency and highlights the odd tiers out", () => {
    const view = ladderView([
      tier(100, [currency, 15, 15]),
      tier(210, [currency, 15, 15]),
      tier(330, [currency, 20, 20]),
      tier(4020, ["specialSummoningToken", 1, 1]),
    ])
    expect(view.total).toEqual({ type: currency, min: 50, max: 50 })
    expect(view.tiles.map((tile) => tile.special)).toEqual([
      false,
      false,
      false,
      true,
    ])
  })

  it("notes a spread once when every tier rolls the same, else shows the range", () => {
    const view = ladderView([
      tier(30, ["gold", 600, 660], ["ShardsOrks", 2, 3]),
      tier(65, ["gold", 800, 880], ["ShardsOrks", 4, 5]),
    ])
    expect(view.spreads).toEqual([{ type: "gold", percent: 10 }])
    expect(view.tiles[0]!.rewards.map((reward) => reward.shown)).toEqual([
      "min",
      "range",
    ])
    expect(view.total).toBeNull()
  })
})
