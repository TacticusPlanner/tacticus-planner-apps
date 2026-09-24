import { describe, expect, it } from "vitest"

import { npcPortrait } from "./npc"

describe("npcPortrait", () => {
  it("resolves a mapped variation id to its portrait under characters/", () => {
    expect(npcPortrait("necroBossWarden")).toBe(
      "/game_catalog/characters/ui_image_portrait_necro_warden_01.png"
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
