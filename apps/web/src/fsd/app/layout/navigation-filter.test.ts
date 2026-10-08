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

    expect(results[0]?.children).toHaveLength(5)
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

  it("finds the Legendary Events section and its All events child by 'legendary'", () => {
    const localized: Record<string, string> = {
      "nav.legendaryEvents": "Legendary Events",
      "legendaryEvents.tabs.allEvents": "All events",
    }
    const results = filterNavigationItems(
      navItems,
      "legendary",
      (key) => localized[key] ?? key
    )

    const section = results.find((item) => item.path === "/legendary-events")
    expect(section?.children?.map((child) => child.path)).toEqual([
      "/legendary-events",
    ])
  })

  it("finds an active event's dynamic child by its name", () => {
    const items = navItems.map((item) =>
      item.path === "/legendary-events"
        ? {
            ...item,
            children: [
              {
                path: "/legendary-events/votanUthar",
                label: "Uthar the Destined",
                description: "Active Legendary Event",
                iconSrc: "/uthar.png",
              },
              ...(item.children ?? []),
            ],
          }
        : item
    )
    const results = filterNavigationItems(items, "uthar", (key) => key)

    expect(results.map((item) => item.path)).toEqual(["/legendary-events"])
    expect(results[0]?.children?.map((child) => child.path)).toEqual([
      "/legendary-events/votanUthar",
    ])
  })
})

describe("navItems", () => {
  it("places Legendary Events after Progress and before Guild", () => {
    const paths = navItems.map((item) => item.path)
    expect(paths.indexOf("/legendary-events")).toBe(
      paths.indexOf("/progress") + 1
    )
    expect(paths.indexOf("/guild")).toBe(paths.indexOf("/legendary-events") + 1)
  })

  it("hides Legendary Events from anonymous users, like Plan, Progress and Guild", () => {
    const anonymous = navItems
      .filter((item) => item.anonymousAllowed)
      .map((item) => item.path)
    for (const path of ["/legendary-events", "/plan", "/progress", "/guild"]) {
      expect(anonymous).not.toContain(path)
    }
  })
})
