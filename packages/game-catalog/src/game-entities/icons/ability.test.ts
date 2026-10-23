import { describe, expect, it } from "vitest"

import { abilityIcon } from "./ability"

describe("abilityIcon", () => {
  it("derives the asset path from the ability id", () => {
    expect(abilityIcon("AdaptiveStrategy")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_AdaptiveStrategy.webp"
    )
    expect(abilityIcon("RelentlessMarch")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_RelentlessMarch.webp"
    )
  })

  it("is a pure id -> path derivation with no override table", () => {
    expect(abilityIcon("NotARealAbility")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_NotARealAbility.webp"
    )
  })
})
