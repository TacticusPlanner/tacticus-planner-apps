import { describe, expect, it } from "vitest"

import { npcPortraitSrc, portraitVariationOf } from "./portrait-variation"

const group = (defaultVariationId: string, ...ids: string[]) => ({
  defaultVariationId,
  variations: ids.map((id) => ({ id })) as never,
})

describe("portraitVariationOf", () => {
  it("borrows the portrait of another variation in the group", () => {
    // Only the Survival variation has a mapped portrait.
    expect(
      portraitVariationOf(
        group("bloodBossDante", "bloodBossDante", "bloodBossDanteSurv")
      )
    ).toBe("bloodBossDanteSurv")
  })

  it("keeps the preferred variation when it has a portrait or none does", () => {
    expect(
      portraitVariationOf(group("bloodBossDanteSurv", "bloodBossDanteSurv"))
    ).toBe("bloodBossDanteSurv")
    expect(portraitVariationOf(group("noSuchNpc", "noSuchNpc"))).toBe(
      "noSuchNpc"
    )
  })
})

describe("npcPortraitSrc", () => {
  it("prefers the variation's own portrait", () => {
    expect(npcPortraitSrc("necroBossWarden", "necroWarden")).toBe(
      "/game_catalog/datamines/atlases/ui_image_portrait_necro_warden_01.webp"
    )
  })

  it("falls back to the playable character's portrait, then to none", () => {
    expect(npcPortraitSrc("noSuchNpc", "bloodDante")).toBe(
      "/game_catalog/datamines/atlases/ui_image_RoundPortrait_blood_dante_01.webp"
    )
    expect(npcPortraitSrc("noSuchNpc", null)).toBeUndefined()
    expect(npcPortraitSrc("noSuchNpc")).toBeUndefined()
  })
})
