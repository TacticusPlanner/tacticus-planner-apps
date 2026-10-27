import { describe, expect, it } from "vitest"

import { abilityIcon } from "./ability"

describe("abilityIcon", () => {
  it("derives the asset path from the ability id", () => {
    expect(abilityIcon("AdaptiveStrategy")).toBe(
      "/game_catalog/datamines/abilities/ui_icon_ability2_AdaptiveStrategy.webp"
    )
    expect(abilityIcon("RelentlessMarch")).toBe(
      "/game_catalog/datamines/abilities/ui_icon_ability2_RelentlessMarch.webp"
    )
  })

  it("derives an unknown id the same way", () => {
    expect(abilityIcon("NotARealAbility")).toBe(
      "/game_catalog/datamines/abilities/ui_icon_ability2_NotARealAbility.webp"
    )
  })

  it("uses the game's spelling and folder where they differ from the id", () => {
    expect(abilityIcon("DaemonfleshPlate")).toBe(
      "/game_catalog/datamines/abilities/ui_icon_ability2_DaemonFleshPlate.webp"
    )
    expect(abilityIcon("EctoplasmaCannon")).toBe(
      "/game_catalog/datamines/abilties/ui_icon_ability2_EctoplasmaCannon.webp"
    )
  })

  it("keeps the planner's own LionHelm icon", () => {
    expect(abilityIcon("LionHelm")).toBe(
      "/game_catalog/abilities/ui_icon_ability2_LionHelm.webp"
    )
  })
})
