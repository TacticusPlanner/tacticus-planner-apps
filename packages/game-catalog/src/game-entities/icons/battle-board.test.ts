// @vitest-environment node
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { QUEST_MAP_IDS } from "../quest-map-ids"
import { battleBoardImage } from "./battle-board"

const QUEST_MAPS_DIR = fileURLToPath(
  new URL(
    "../../../../../apps/web/public/game_catalog/curated/quest_maps/",
    import.meta.url
  )
)

describe("battleBoardImage", () => {
  it("resolves a quest board under quest_maps/", () => {
    expect(battleBoardImage("MC2_01")).toBe(
      "/game_catalog/curated/quest_maps/MC2_01.webp"
    )
  })

  it("falls through to le_maps/ for a board only shipped there", () => {
    expect(battleBoardImage("LE1_26")).toBe(
      "/game_catalog/curated/le_maps/LE1_26.webp"
    )
  })

  it("returns undefined for a board with no shipped image", () => {
    expect(battleBoardImage("C4_35")).toBeUndefined()
  })

  it("lists exactly the boards in the quest_maps directory", () => {
    const shipped = readdirSync(QUEST_MAPS_DIR)
      .filter((file) => file.endsWith(".webp"))
      .map((file) => file.slice(0, -".webp".length))
      .sort()
    expect([...QUEST_MAP_IDS].sort()).toEqual(shipped)
  })
})
