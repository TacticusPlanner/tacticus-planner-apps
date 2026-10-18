// @vitest-environment node
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { LE_MAP_IDS } from "../le-map-ids"
import { legendaryEventMap } from "./le-map"

const LE_MAPS_DIR = fileURLToPath(
  new URL(
    "../../../../../apps/web/public/game_catalog/le_maps/",
    import.meta.url
  )
)

describe("legendaryEventMap", () => {
  it("resolves a shipped map id to its tactical image under le_maps/", () => {
    expect(legendaryEventMap("LE1_26")).toBe("/game_catalog/le_maps/LE1_26.jpg")
  })

  it("returns undefined for a map id with no shipped image", () => {
    expect(legendaryEventMap("C4_35")).toBeUndefined()
  })

  it("lists exactly the tactical maps in the le_maps directory", () => {
    const shipped = readdirSync(LE_MAPS_DIR)
      .filter((file) => file.endsWith(".jpg") && !file.endsWith("_Visual.jpg"))
      .map((file) => file.slice(0, -".jpg".length))
      .sort()
    expect([...LE_MAP_IDS].sort()).toEqual(shipped)
  })
})
