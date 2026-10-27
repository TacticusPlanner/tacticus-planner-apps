import { describe, expect, it } from "vitest"

import { factionIcon } from "./faction"

describe("factionIcon", () => {
  it("resolves a faction id to the game's emblem", () => {
    expect(factionIcon("Sisterhood")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_faction_adeptas_01.webp"
    )
    expect(factionIcon("Tau")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_faction_tau_01.webp"
    )
  })

  it("has no emblem for the loot-object bucket", () => {
    expect(factionIcon("Objects")).toBeUndefined()
  })
})
