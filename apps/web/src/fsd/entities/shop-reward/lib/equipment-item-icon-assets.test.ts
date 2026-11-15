import { describe, expect, it } from "vitest"

import { EquipmentIcons } from "@workspace/game-catalog"
import type { EquipmentId } from "@workspace/game-domain"

import equipmentItems from "../../../../../public/locales/en/equipmentItems.json"

// Vite's glob lists the shipped assets with their exact filename case, so the audit catches a file that
// only resolves on a case-insensitive filesystem (Windows) and 404s on the case-sensitive host.
const shippedCatalogImages = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/**/*.webp", { query: "?url" })
  ).map((path) => path.replace(/^\/public/, ""))
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

    const missing = namedIds.filter(
      (id) =>
        !KNOWN_GAPS.has(id) &&
        !shippedCatalogImages.has(EquipmentIcons.icon(id as EquipmentId))
    )

    expect(missing).toEqual([])
  })

  it("keeps the known gaps honest", () => {
    for (const id of KNOWN_GAPS) {
      expect(
        shippedCatalogImages.has(EquipmentIcons.icon(id as EquipmentId)),
        id
      ).toBe(false)
    }
    expect(shippedCatalogImages.has(EquipmentIcons.fallback)).toBe(true)
  })
})
