import { globalValuesFixture } from "@workspace/game-catalog/testing"
import { describe, expect, it } from "vitest"

import { dailyEnergyTiers } from "./energy-tiers"

describe("dailyEnergyTiers", () => {
  it("builds the shipped ladder from the game's regeneration and stamina shop", () => {
    expect(dailyEnergyTiers(globalValuesFixture)).toEqual([
      { energy: 288, source: "free" },
      { energy: 378, source: "ad" },
      { energy: 438, source: { gems: 25 } },
      { energy: 538, source: { gems: 50 } },
      { energy: 638, source: { gems: 110 } },
      { energy: 738, source: { gems: 250 } },
      { energy: 838, source: { gems: 500 } },
      { energy: 938, source: { gems: 1000 } },
    ])
  })

  it("follows a change to the regeneration rate", () => {
    const tiers = dailyEnergyTiers({
      ...globalValuesFixture,
      staminaRegenerationTime: 600,
      staminaShopTiers: [],
    })
    expect(tiers.map((tier) => tier.energy)).toEqual([144, 234])
  })
})
