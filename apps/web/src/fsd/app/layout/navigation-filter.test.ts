import { describe, expect, it } from "vitest"

import { filterNavigationItems } from "./navigation-filter"
import { navItems } from "./nav-items"

const labels: Record<string, string> = {
  "library:section.label": "Nachschlagen",
  "library:collections.characters.label": "Charaktere",
  "library:collections.machinesOfWar.label": "Kriegsmaschinen",
  "library:collections.npcs.label": "NPCs",
}

describe("filterNavigationItems", () => {
  it("keeps the parent context when a localized child label matches", () => {
    const results = filterNavigationItems(
      navItems,
      "Kriegs",
      (key) => labels[key] ?? key
    )

    expect(results).toHaveLength(1)
    expect(results[0]?.path).toBe("/library")
    expect(results[0]?.children?.map((child) => child.path)).toEqual([
      "/library/machines-of-war",
    ])
  })

  it("keeps all children when the parent matches", () => {
    const results = filterNavigationItems(
      navItems,
      "Nachschlagen",
      (key) => labels[key] ?? key
    )

    expect(results[0]?.children).toHaveLength(4)
  })

  it(
    "matches a query against an item's description even when the label" +
      " doesn't match",
    () => {
      const descriptions: Record<string, string> = {
        "library:section.description": "Nachschlagen",
        "library:collections.machinesOfWar.description":
          "Kriegsmaschinen nachschlagen",
      }
      const results = filterNavigationItems(
        navItems,
        "Kriegsmaschinen nachschlagen",
        (key) => descriptions[key] ?? labels[key] ?? key
      )

      expect(results).toHaveLength(1)
      expect(results[0]?.path).toBe("/library")
      expect(results[0]?.children?.map((child) => child.path)).toEqual([
        "/library/machines-of-war",
      ])
    }
  )
})
