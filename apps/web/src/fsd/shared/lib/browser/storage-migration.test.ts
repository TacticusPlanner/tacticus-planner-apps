// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"

import { preferenceRecords, storageKeys } from "./storage-keys"
import {
  accountMoves,
  migrateStorage,
  preferenceMoves,
  removedKeys,
} from "./storage-migration"

const local = window.localStorage
const session = window.sessionStorage
const record = (key: string) => JSON.parse(local.getItem(key) ?? "null")

describe("migrateStorage", () => {
  beforeEach(() => {
    local.clear()
    session.clear()
  })

  it("folds each feature's old keys into its record, converting values", () => {
    local.setItem("collection.view", "table")
    local.setItem("collection.sort", "power")
    local.setItem("teams.layout", "table")
    local.setItem("guildWar.zone", "Trenches1")
    local.setItem("home-live-event-count", "6")
    local.setItem("legendaryEvents.tokenPlan.open", "true")
    local.setItem("legendaryEvents.upgradeImpact.open", "closed")
    local.setItem("tp.tour.autoStarted", "1")
    local.setItem(
      "raids-filters.v1",
      JSON.stringify({ alliesFactions: ["Ultramarines"] })
    )

    migrateStorage()

    expect(record("tp.collection")).toEqual({ view: "table", sort: "power" })
    expect(record("tp.teams")).toEqual({ layout: "table" })
    expect(record("tp.guildWar")).toEqual({ zone: "Trenches1" })
    expect(record("tp.home")).toEqual({ liveEventCount: 6 })
    expect(record("tp.legendaryEvents")).toEqual({
      tokenPlanOpen: true,
      upgradeImpactOpen: "closed",
    })
    expect(record("tp.dismissed")).toEqual({ tourAutoStarted: true })
    expect(record("tp.dailies")).toEqual({
      raidsFilters: { alliesFactions: ["Ultramarines"] },
    })
    for (const key of [
      "collection.view",
      "collection.sort",
      "teams.layout",
      "guildWar.zone",
      "home-live-event-count",
      "raids-filters.v1",
      "tp.tour.autoStarted",
    ]) {
      expect(local.getItem(key)).toBeNull()
    }
  })

  it("keeps a value already in the record over the old key", () => {
    local.setItem("tp.collection", JSON.stringify({ view: "cards" }))
    local.setItem("collection.view", "table")
    local.setItem("collection.sort", "power")

    migrateStorage()

    expect(record("tp.collection")).toEqual({ view: "cards", sort: "power" })
    expect(local.getItem("collection.view")).toBeNull()
  })

  it("drops an unreadable old value instead of storing it", () => {
    local.setItem("home-token-count", "lots")
    local.setItem("raids-filters.v1", "{not json")

    migrateStorage()

    expect(record("tp.home")).toEqual({})
    expect(record("tp.dailies")).toEqual({})
    expect(local.getItem("home-token-count")).toBeNull()
  })

  it("moves account data to tp.user and folds token reports into one record", () => {
    local.setItem("tp.session.owner", "account-1")
    local.setItem("tp.session.dailies.quest.progress.v1", '{"q":1}')
    local.setItem("tp.dailies.hre.progress.v1", '{"h":1}')
    local.setItem("goals.overview.collapsedGroups", '["project:p1"]')
    local.setItem("tp.session.lre.shownTokens.event-1", '[{"run":1}]')
    local.setItem("tp.session.lre.shownTokens.event-2", '[{"run":2}]')

    migrateStorage()

    expect(local.getItem(storageKeys.userOwner)).toBe("account-1")
    expect(local.getItem(storageKeys.userQuestProgress)).toBe('{"q":1}')
    expect(local.getItem(storageKeys.userHreProgress)).toBe('{"h":1}')
    expect(local.getItem(storageKeys.userGoalsCollapsedGroups)).toBe(
      '["project:p1"]'
    )
    expect(record(storageKeys.userLegendaryEventShownTokens)).toEqual({
      "event-1": [{ run: 1 }],
      "event-2": [{ run: 2 }],
    })
    expect(
      Object.keys(local).filter(
        (key) => key.startsWith("tp.session.") || !key.startsWith("tp.")
      )
    ).toEqual([])
  })

  it("keeps account data already under the new name", () => {
    local.setItem(storageKeys.userSelectedProject, "new")
    local.setItem("tp.session.project.selected.v1", "old")

    migrateStorage()

    expect(local.getItem(storageKeys.userSelectedProject)).toBe("new")
    expect(local.getItem("tp.session.project.selected.v1")).toBeNull()
  })

  it("renames the session keys", () => {
    session.setItem("nav.lastVisitedChild", '{"/plan":"/plan/goals"}')
    session.setItem("tp:stale-reload:/plan?x=1", "doc-1")

    migrateStorage()

    expect(session.getItem("tp.nav.lastVisitedChild")).toBe(
      '{"/plan":"/plan/goals"}'
    )
    expect(session.getItem("tp.staleReload./plan?x=1")).toBe("doc-1")
    expect(session.getItem("nav.lastVisitedChild")).toBeNull()
    expect(session.getItem("tp:stale-reload:/plan?x=1")).toBeNull()
  })

  it("deletes the keys of removed features", () => {
    for (const key of removedKeys) local.setItem(key, "x")

    migrateStorage()

    for (const key of removedKeys) expect(local.getItem(key)).toBeNull()
  })

  it("changes nothing when there is nothing to move", () => {
    local.setItem("tp.teams", JSON.stringify({ mode: "all" }))
    local.setItem("theme", "dark")

    migrateStorage()

    expect(Object.fromEntries(Object.entries(local))).toEqual({
      "tp.teams": JSON.stringify({ mode: "all" }),
      theme: "dark",
    })
  })
})

describe("the key registry", () => {
  it("names every key under tp. except the two read before the app runs", () => {
    const keys = [
      ...Object.values(storageKeys),
      ...Object.keys(preferenceRecords).map((name) => `tp.${name}`),
    ]
    expect(new Set(keys).size).toBe(keys.length)
    expect(
      keys
        .filter((key) => !key.startsWith("tp."))
        .toSorted((a, b) => a.localeCompare(b))
    ).toEqual(["i18nextLng", "theme"])
  })

  it("moves each old key to exactly one place", () => {
    const sources = [
      ...preferenceMoves.map((entry) => entry.from),
      ...accountMoves.flatMap(([from]) => from),
      ...removedKeys,
    ]
    expect(new Set(sources).size).toBe(sources.length)
    for (const { record: name, field } of preferenceMoves) {
      expect(preferenceRecords[name] as readonly string[]).toContain(field)
    }
  })
})
