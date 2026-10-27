import { describe, expect, it } from "vitest"

import { traitIcon } from "./trait"

describe("traitIcon", () => {
  it("converts a simple PascalCase trait id to its snake_case filename", () => {
    expect(traitIcon("Healer")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_healer_01.webp"
    )
    expect(traitIcon("ActOfFaith")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_act_of_faith_01.webp"
    )
    expect(traitIcon("ShadowInTheWarp")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_shadow_in_the_warp_01.webp"
    )
  })

  it("uses the override map for irregular trait filenames", () => {
    expect(traitIcon("Psyker")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_psychic_01.webp"
    )
    expect(traitIcon("LivingMetal")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_livingmetall_01.webp"
    )
    expect(traitIcon("Unstoppable")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_mounted_01.webp"
    )
    expect(traitIcon("GetStuckIn")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_beast_snagga_01.webp"
    )
    expect(traitIcon("Boss")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_boss_adjutant_01.webp"
    )
  })
})
