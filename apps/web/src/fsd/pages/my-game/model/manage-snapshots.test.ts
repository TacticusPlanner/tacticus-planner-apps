import { describe, expect, it } from "vitest"

import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"

import { canKeep, manageSections } from "./manage-snapshots"

const snapshot = (
  id: string,
  source: PersonalRosterSnapshot["source"]
): PersonalRosterSnapshot => ({
  id,
  name: id,
  source,
  takenAt: "2026-11-03T10:00:00Z",
  characterCount: 1,
  mowCount: 0,
})

const list = (
  items: PersonalRosterSnapshot[],
  count = 0
): PersonalRosterSnapshotList => ({
  limit: 20,
  count,
  autoLimit: 12,
  autoCount: items.filter((item) => item.source === "auto").length,
  items,
})

describe("manageSections", () => {
  it("puts V1 imports with manual snapshots and keeps the list order", () => {
    const sections = manageSections(
      list([
        snapshot("a1", "auto"),
        snapshot("m1", "manual"),
        snapshot("v1", "v1Import"),
        snapshot("a2", "auto"),
      ])
    )

    expect(sections.manual.map((item) => item.id)).toEqual(["m1", "v1"])
    expect(sections.auto.map((item) => item.id)).toEqual(["a1", "a2"])
  })

  it("is empty before the list loads", () => {
    expect(manageSections(undefined)).toEqual({ manual: [], auto: [] })
  })
})

describe("canKeep", () => {
  it("needs room under the manual limit", () => {
    expect(canKeep(list([], 19))).toBe(true)
    expect(canKeep(list([], 20))).toBe(false)
    expect(canKeep(undefined)).toBe(false)
  })
})
