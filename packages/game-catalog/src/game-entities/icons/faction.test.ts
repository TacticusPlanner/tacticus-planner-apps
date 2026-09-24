import { describe, expect, it } from "vitest"

import { factionIcon } from "./faction"

describe("factionIcon", () => {
  it("resolves a faction id to its emblem", () => {
    expect(factionIcon("Sisterhood")).toBe(
      "/game_catalog/factions/Sisterhood.png"
    )
    expect(factionIcon("Tau")).toBe("/game_catalog/factions/Tau.png")
  })

  it("has no emblem for the loot-object bucket", () => {
    expect(factionIcon("Objects")).toBeUndefined()
  })
})
