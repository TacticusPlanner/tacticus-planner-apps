import { describe, expect, it } from "vitest"

import { npcPortrait } from "./npc"

describe("npcPortrait", () => {
  it("resolves a mapped variation id to its game portrait sprite", () => {
    expect(npcPortrait("necroBossWarden")).toBe(
      "/game_catalog/datamines/atlases/ui_image_portrait_necro_warden_01.webp"
    )
  })

  it("maps every variation of a unit to the same portrait", () => {
    expect(npcPortrait("necroBossWardenLHE")).toBe(
      npcPortrait("necroNpcWarden")
    )
  })

  it("returns undefined for an unknown id", () => {
    expect(npcPortrait("notAnNpc")).toBeUndefined()
  })
})
