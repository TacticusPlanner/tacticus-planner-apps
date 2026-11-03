import { describe, expect, it } from "vitest"

import type { V1RosterSnapshotOutcome } from "@/entities/account"

import {
  groupRosterSnapshotOutcomes,
  reasonKeyForRosterSnapshotOutcome,
  reasonKeyForRosterSnapshotPart,
} from "./roster-snapshot-outcome-buckets"

const outcome = (
  name: string,
  status: V1RosterSnapshotOutcome["status"]
): V1RosterSnapshotOutcome => ({
  name,
  takenAt: "2026-05-01T09:30:00Z",
  status,
  code: null,
  droppedUnits: 0,
})

describe("groupRosterSnapshotOutcomes", () => {
  it("buckets each status like goals", () => {
    const buckets = groupRosterSnapshotOutcomes([
      outcome("a", "imported"),
      outcome("b", "skippedDuplicate"),
      outcome("c", "skippedLimit"),
      outcome("d", "skippedDeleted"),
      outcome("e", "failed"),
    ])

    expect(buckets.imported.map((item) => item.name)).toEqual(["a"])
    expect(buckets.needsNoImport.map((item) => item.name)).toEqual(["b"])
    expect(buckets.notImported.map((item) => item.name)).toEqual(["c", "d"])
    expect(buckets.failed.map((item) => item.name)).toEqual(["e"])
  })
})

describe("reason keys", () => {
  it("translates every status and known part code", () => {
    expect(reasonKeyForRosterSnapshotOutcome({ status: "skippedLimit" })).toBe(
      "goals.v1Import.rosterSnapshots.reasons.skippedLimit"
    )
    expect(reasonKeyForRosterSnapshotPart("missing_roster_snapshots")).toBe(
      "goals.v1Import.rosterSnapshots.partReasons.missing_roster_snapshots"
    )
    expect(reasonKeyForRosterSnapshotPart("something_new")).toBe(
      "goals.v1Import.reasons.generic"
    )
  })
})
