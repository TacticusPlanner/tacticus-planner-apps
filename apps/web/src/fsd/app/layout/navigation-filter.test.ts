import { describe, expect, it } from "vitest"

import { filterNavigationItems } from "./navigation-filter"
import { navItems } from "./nav-items"

const labels: Record<string, string> = {
  "nav.lookup": "Nachschlagen",
  "unitLookup.tabs.character": "Charaktere",
  "unitLookup.tabs.mow": "Kriegsmaschinen",
  "unitLookup.tabs.npc": "NPCs",
}

describe("filterNavigationItems", () => {
  it("keeps the parent context when a localized child label matches", () => {
    const results = filterNavigationItems(
      navItems,
      "Kriegs",
      (key) => labels[key] ?? key
    )

    expect(results).toHaveLength(1)
    expect(results[0]?.path).toBe("/lookup")
    expect(results[0]?.children?.map((child) => child.path)).toEqual([
      "/lookup/mow",
    ])
  })

  it("keeps all children when the parent matches", () => {
    const results = filterNavigationItems(
      navItems,
      "Nachschlagen",
      (key) => labels[key] ?? key
    )

    expect(results[0]?.children).toHaveLength(3)
  })

  it(
    "matches a query against an item's description even when the label" +
      " doesn't match",
    () => {
      const descriptions: Record<string, string> = {
        "nav.lookupDescription": "Nachschlagen",
        "unitLookup.tabs.mowDescription": "Kriegsmaschinen nachschlagen",
      }
      const results = filterNavigationItems(
        navItems,
        "Kriegsmaschinen nachschlagen",
        (key) => descriptions[key] ?? labels[key] ?? key
      )

      expect(results).toHaveLength(1)
      expect(results[0]?.path).toBe("/lookup")
      expect(results[0]?.children?.map((child) => child.path)).toEqual([
        "/lookup/mow",
      ])
    }
  )
})
