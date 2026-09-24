import { describe, expect, it } from "vitest"

import { abilityIcon } from "./ability"

describe("abilityIcon", () => {
  it("derives the asset path from the ability id", () => {
    expect(abilityIcon("AdaptiveStrategy")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_AdaptiveStrategy.png"
    )
    expect(abilityIcon("RelentlessMarch")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_RelentlessMarch.png"
    )
  })

  it("is a pure id -> path derivation with no override table", () => {
    expect(abilityIcon("NotARealAbility")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_NotARealAbility.png"
    )
  })
})
