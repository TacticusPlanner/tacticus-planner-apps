import { describe, expect, it } from "vitest"

import { filterNavigationItems } from "./navigation-filter"
import { filterVisibleNavItems, navItems } from "./nav-items"

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

  it("finds the Legendary Events section and its static children by 'legendary'", () => {
    const localized: Record<string, string> = {
      "nav.legendaryEvents": "Legendary Events",
      "legendaryEvents.tabs.allEvents": "All events",
      "legendaryEvents.tabs.masterTable": "Master table",
      "legendaryEvents.tabs.masterTableDescription":
        "Every unit's points across the events you pick",
      "legendaryEvents.tabs.tierList": "Tier List",
      "legendaryEvents.tabs.tierListDescription":
        "The horde-mode tier list behind clear estimates",
    }
    const results = filterNavigationItems(
      navItems,
      "legendary",
      (key) => localized[key] ?? key
    )

    const section = results.find((item) => item.path === "/legendary-events")
    expect(section?.children?.map((child) => child.path)).toEqual([
      "/legendary-events",
      "/legendary-events/master-table",
      "/legendary-events/tier-list",
    ])
  })

  it.each([
    ["master", "/legendary-events/master-table"],
    ["tier", "/legendary-events/tier-list"],
  ])("finds the static Legendary Events child by '%s'", (query, path) => {
    const localized: Record<string, string> = {
      "nav.legendaryEvents": "Legendary Events",
      "nav.legendaryEventsDescription": "Active, upcoming and past events",
      "legendaryEvents.tabs.allEvents": "All events",
      "legendaryEvents.tabs.allEventsDescription": "Every event",
      "legendaryEvents.tabs.masterTable": "Master table",
      "legendaryEvents.tabs.masterTableDescription": "Every unit's points",
      "legendaryEvents.tabs.tierList": "Tier List",
      "legendaryEvents.tabs.tierListDescription": "Horde-mode multipliers",
    }
    const results = filterNavigationItems(
      navItems,
      query,
      (key) => localized[key] ?? ""
    )
    const section = results.find((item) => item.path === "/legendary-events")
    expect(section?.children?.map((child) => child.path)).toEqual([path])
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
  it("places Legendary Events after My Game and before Guild", () => {
    const paths = navItems.map((item) => item.path)
    expect(paths.indexOf("/legendary-events")).toBe(
      paths.indexOf("/my-game") + 1
    )
    expect(paths.indexOf("/guild")).toBe(paths.indexOf("/legendary-events") + 1)
  })

  it("lists My Game's children with Collection first", () => {
    const myGame = navItems.find((item) => item.path === "/my-game")
    expect(myGame?.children?.map((child) => child.path)).toEqual([
      "/my-game/collection",
      "/my-game/onslaught",
      "/my-game/campaigns",
      "/my-game/campaign-events",
    ])
  })

  it("hides Legendary Events from anonymous users, like Plan and Guild", () => {
    const anonymous = filterVisibleNavItems(navItems, false).map(
      (item) => item.path
    )
    for (const path of ["/legendary-events", "/plan", "/guild"]) {
      expect(anonymous).not.toContain(path)
    }
    expect(anonymous).toContain("/my-game")
  })
})

describe("filterVisibleNavItems", () => {
  const myGameChildren = (items: typeof navItems) =>
    items
      .find((item) => item.path === "/my-game")
      ?.children?.map((child) => child.path)

  it("returns the whole tree for a signed-in user", () => {
    const visible = filterVisibleNavItems(navItems, true)
    expect(visible).toBe(navItems)
    expect(myGameChildren(visible)).toHaveLength(4)
  })

  it("keeps only My Game's anonymous children for a signed-out user", () => {
    expect(myGameChildren(filterVisibleNavItems(navItems, false))).toEqual([
      "/my-game/collection",
    ])
  })

  it("lets a child inherit its section's access when it sets none", () => {
    const library = filterVisibleNavItems(navItems, false).find(
      (item) => item.path === "/library"
    )
    expect(library).toBe(navItems.find((item) => item.path === "/library"))
  })

  it("drops an anonymous section whose children all require sign-in", () => {
    const items = [
      {
        ...navItems.find((item) => item.path === "/my-game")!,
        children: [
          {
            path: "/my-game/onslaught",
            labelKey: "myGame.tabs.onslaught" as const,
            descriptionKey: "myGame.tabs.onslaughtDescription" as const,
            anonymousAllowed: false,
          },
        ],
      },
    ]
    expect(filterVisibleNavItems(items, false)).toEqual([])
  })

  it("keeps sign-in-only children out of an anonymous user's search", () => {
    const visible = filterVisibleNavItems(navItems, false)
    const byKey = (key: string) =>
      ({
        "myGame.tabs.onslaught": "Onslaught",
        "myGame.tabs.collection": "Collection",
      })[key] ?? key

    expect(filterNavigationItems(visible, "onslaught", byKey)).toEqual([])
    const myGame = filterNavigationItems(visible, "collection", byKey).find(
      (item) => item.path === "/my-game"
    )
    expect(myGame?.children?.map((child) => child.path)).toEqual([
      "/my-game/collection",
    ])
  })
})
