import { describe, expect, it } from "vitest"

import { traitIcon } from "./trait"

describe("traitIcon", () => {
  it("converts a simple PascalCase trait id to its snake_case filename", () => {
    expect(traitIcon("Healer")).toBe(
      "/game_catalog/traits/ui_icon_trait_healer_01.png"
    )
    expect(traitIcon("ActOfFaith")).toBe(
      "/game_catalog/traits/ui_icon_trait_act_of_faith_01.png"
    )
    expect(traitIcon("ShadowInTheWarp")).toBe(
      "/game_catalog/traits/ui_icon_trait_shadow_in_the_warp_01.png"
    )
  })

  it("uses the override map for irregular trait filenames", () => {
    expect(traitIcon("Psyker")).toBe(
      "/game_catalog/traits/ui_icon_trait_psychic_01.png"
    )
    expect(traitIcon("LivingMetal")).toBe(
      "/game_catalog/traits/ui_icon_trait_livingmetall_01.png"
    )
    expect(traitIcon("Unstoppable")).toBe(
      "/game_catalog/traits/ui_icon_trait_unknown_01.png"
    )
  })
})
