import { describe, expect, it } from "vitest"

import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"

import {
  canKeep,
  manageRunRecordRows,
  manageSections,
  nextAutoSnapshot,
} from "./manage-snapshots"

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

describe("nextAutoSnapshot", () => {
  const now = Date.parse("2026-11-25T12:00:00Z")

  it("is the next sync with no roster at all", () => {
    expect(nextAutoSnapshot([], [], now)).toEqual({ kind: "nextSync" })
  })

  it("waits 30 days from the newest snapshot or Legendary Event roster", () => {
    expect(
      nextAutoSnapshot(
        [{ takenAt: "2026-11-01T00:00:00Z" }],
        [{ progressAt: "2026-11-20T00:00:00Z" }],
        now
      )
    ).toEqual({ kind: "after", atMs: Date.parse("2026-12-20T00:00:00Z") })
  })

  it("is the next sync once the window has passed", () => {
    expect(
      nextAutoSnapshot([{ takenAt: "2026-10-01T00:00:00Z" }], [], now)
    ).toEqual({ kind: "nextSync" })
  })
})

describe("manageRunRecordRows", () => {
  it("names each roster from the catalog, newest first", () => {
    expect(
      manageRunRecordRows(
        [
          {
            id: "r1",
            eventId: "votanUthar",
            run: 1,
            progressAt: "2026-10-01T00:00:00Z",
          },
          {
            id: "r2",
            eventId: "gone",
            run: 2,
            progressAt: "2026-11-01T00:00:00Z",
          },
        ],
        new Map([["votanUthar", "Uthar"]])
      )
    ).toEqual([
      { id: "r2", eventName: "gone", run: 2, takenAt: "2026-11-01T00:00:00Z" },
      { id: "r1", eventName: "Uthar", run: 1, takenAt: "2026-10-01T00:00:00Z" },
    ])
  })
})
