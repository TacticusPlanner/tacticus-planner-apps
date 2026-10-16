import { describe, expect, it } from "vitest"

import { EquipmentIcons } from "@workspace/game-catalog"
import type { EquipmentId } from "@workspace/game-domain"

import equipmentItems from "../../../../../public/locales/en/equipmentItems.json"

// Vite's glob lists the shipped assets with their exact filename case, so the audit catches a file that
// only resolves on a case-insensitive filesystem (Windows) and 404s on the case-sensitive host.
const shippedEquipmentIcons = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/equipment/*.png", { query: "?url" })
  ).map((path) => path.split("/").pop()!)
)

// Named items with no asset in V1 or the game data: they show EquipmentIcons.fallback.
const KNOWN_GAPS = new Set(["I_Block_E005", "I_Block_L005"])

// The 12 unnamed catalog items carry a `_<id>` placeholder name and are never shown by name.
const namedIds = Object.entries(equipmentItems as Record<string, string>)
  .filter(([, name]) => !name.startsWith("_"))
  .map(([id]) => id)

describe("equipment item icon assets", () => {
  it("ships an exact-case icon for every named catalog item except the known gaps", () => {
    expect(namedIds.length).toBeGreaterThan(200)

    const missing = namedIds.filter((id) => {
      const file = EquipmentIcons.icon(id as EquipmentId)
        .split("/")
        .pop()!
      return !KNOWN_GAPS.has(id) && !shippedEquipmentIcons.has(file)
    })

    expect(missing).toEqual([])
  })

  it("keeps the known gaps honest", () => {
    for (const id of KNOWN_GAPS) {
      expect(shippedEquipmentIcons.has(`ui_icon_item_${id}.png`), id).toBe(
        false
      )
    }
    expect(shippedEquipmentIcons.has("ui_icon_item_unknown.png")).toBe(true)
  })
})
