import { describe, expect, it } from "vitest"

import { navItems } from "./nav-items"
import type { NavTranslate } from "./nav-items"
import { buildNavigationGroups, matchTier } from "./navigation-search"
import type { NavigationEntry } from "./navigation-search"
import type { QuickAction } from "./quick-actions"

// Readable English for the keys the ranking reads, so queries look like what players type.
const LABELS: Record<string, string> = {
  "nav.home": "Home",
  "nav.dailies": "Dailies",
  "nav.dailiesDescription": "Daily and periodic in-game tasks.",
  "nav.myGame": "My Game",
  "myGame.tabs.teams": "Teams",
  "myGame.tabs.teamsDescription":
    "Your saved lineups for Guild War, Guild Raid and other modes.",
  "goals.tabs.schedule": "Schedule",
  "goals.tabs.scheduleDescription":
    "Day-by-day raids for your active goals until they're done.",
  "dailies:tabs.raids": "Raids",
  "dailies:tabs.raidsDescription": "Spend today's energy on your goals.",
  "dailies:tabs.guild-raids": "Guild Raids",
  "nav.guild": "Guild",
  "guild.groups.guildWar": "Guild War",
  "guild.tabs.warOffense": "Offense",
  "library:section.label": "Library",
  "library:collections.raidBosses.label": "Guild Raid Bosses",
  "nav.legendaryEvents": "Legendary Events",
  "legendaryEvents.tabs.allEvents": "All events",
}
// Other keys read as their last segment ("eventShop"), so a namespace never matches a query.
const t: NavTranslate = (key) => LABELS[key] ?? key.split(/[.:]/).at(-1) ?? key

const sync: QuickAction = {
  id: "sync",
  icon: (() => null) as unknown as QuickAction["icon"],
  label: "Sync with Tacticus",
  description: "Refresh your planner from Tacticus",
  keywords: ["api"],
}

const build = (query: string, actions: QuickAction[] = [sync]) =>
  buildNavigationGroups({
    actions,
    getEntryPath: (item) => `${item.path}?entry`,
    items: navItems,
    query,
    t,
  })

const recentBuild = (query: string) =>
  buildNavigationGroups({
    actions: [sync],
    getEntryPath: (item) => item.path,
    items: navItems,
    query,
    recentPaths: ["/dailies/raids", "/gone", "/home"],
    t,
  })

/** The entries of the query's first (best) group, or of the group at `index`. */
const entriesOf = (query: string, index = 0, actions?: QuickAction[]) =>
  build(query, actions).at(index)?.entries ?? []

const labelOf = (entry: NavigationEntry | undefined) => {
  if (!entry) return undefined
  switch (entry.kind) {
    case "action": {
      return entry.action.label
    }
    case "section": {
      return t(entry.item.labelKey)
    }
    case "child": {
      return "labelKey" in entry.item ? t(entry.item.labelKey) : ""
    }
  }
}

describe("matchTier", () => {
  const fields = {
    label: "Guild Raid Bosses",
    description: "Boss stats, abilities and meta teams.",
    keywords: ["gr"],
    context: ["Library"],
  }

  it("ranks a label prefix over a label word over a keyword over the description", () => {
    expect(matchTier("guild", fields)).toBe(0)
    expect(matchTier("raid", fields)).toBe(1)
    expect(matchTier("gr", fields)).toBe(2)
    expect(matchTier("abil", fields)).toBe(3)
    expect(matchTier("libr", fields)).toBe(4)
  })

  it("matches a multi-word query when every word starts a word in the row", () => {
    expect(matchTier("library boss", fields)).toBe(5)
  })

  it("falls back to a substring only from three characters", () => {
    expect(matchTier("oss", fields)).toBe(6)
    expect(matchTier("ss", fields)).toBeUndefined()
  })

  it("returns nothing when no field matches", () => {
    expect(matchTier("zzz", fields)).toBeUndefined()
  })
})

describe("buildNavigationGroups", () => {
  it("lists every action, then the whole page tree in menu order, with no query", () => {
    const groups = build("  ")

    expect(groups.map((group) => group.id)).toEqual(["actions", "pages"])
    const pages = entriesOf("  ", 1)
    expect(pages[0]).toMatchObject({ kind: "section", to: "/home?entry" })
    const raids = pages.find((entry) => entry.key === "child:/dailies/raids")
    expect(raids).toMatchObject({ kind: "child", to: "/dailies/raids" })
  })

  it("marks the first child of each group with its label, for the tree", () => {
    const children = entriesOf("", 1).filter(
      (entry) => entry.kind === "child" && entry.section.path === "/guild"
    )

    expect(
      children.map((entry) => entry.kind === "child" && entry.groupLabelKey)
    ).toEqual([
      "guild.groups.guild",
      undefined,
      "guild.groups.guildWar",
      undefined,
    ])
  })

  it("ranks title matches above description matches, keeping menu order within a tier", () => {
    expect(build("raid").at(0)?.id).toBe("pages")
    expect(entriesOf("raid").slice(0, 5).map(labelOf)).toEqual([
      "Raids",
      "Guild Raids",
      "Guild Raid Bosses",
      "Teams",
      "Schedule",
    ])
  })

  it("names a child's group, else its section, as its breadcrumb", () => {
    expect(entriesOf("offense")[0]).toMatchObject({ crumb: "Guild War" })
    expect(entriesOf("raids")[0]).toMatchObject({ crumb: "Dailies" })
  })

  it("finds pages by the shorthand players type", () => {
    expect(labelOf(entriesOf("gw")[0])).toBe("Offense")
    expect(labelOf(entriesOf("lre")[0])).toBe("Legendary Events")
  })

  it("lists a section's pages when the query names the section", () => {
    const labels = entriesOf("dailies").map(labelOf)

    expect(labels[0]).toBe("Dailies")
    expect(labels).toContain("Raids")
  })

  it("puts the group with the better match first, actions on a tie", () => {
    expect(build("sync").at(0)?.id).toBe("actions")
    // A keyword on both sides (api, api key): a tie.
    expect(build("api").at(0)?.id).toBe("actions")
    // The query is trimmed and lowercased before ranking.
    expect(build("  API ").at(0)?.id).toBe("actions")
    // "Raid" is a page title; the sync action does not match at all.
    expect(build("raid").map((group) => group.id)).toEqual(["pages"])
    const goalAction = {
      ...sync,
      id: "createGoal" as const,
      label: "Create goal",
      keywords: [],
    }
    expect(build("raids", [goalAction]).map((group) => group.id)).toEqual([
      "pages",
    ])
  })

  it("lists recent pages first with no query, and only then", () => {
    const [recent] = recentBuild("")
    expect(recent?.id).toBe("recent")
    expect(recent?.entries.map(labelOf)).toEqual(["Raids", "Home"])
    expect(recent?.entries[0]?.key).toBe("recent:child:/dailies/raids")
    expect(recentBuild("raid").map((group) => group.id)).not.toContain("recent")
  })

  it("leaves search-only actions out until a query matches them", () => {
    const signOut = {
      ...sync,
      id: "signOut" as const,
      label: "Sign out",
      keywords: ["log out"],
      searchOnly: true,
    }

    expect(entriesOf("", 0, [sync, signOut]).map(labelOf)).toEqual([
      "Sync with Tacticus",
    ])
    expect(labelOf(entriesOf("log out", 0, [sync, signOut])[0])).toBe(
      "Sign out"
    )
  })

  it("returns no groups when nothing matches", () => {
    expect(build("zzzz-nothing")).toEqual([])
  })
})
