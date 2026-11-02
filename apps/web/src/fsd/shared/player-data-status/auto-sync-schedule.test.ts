import { describe, expect, it } from "vitest"

import { autoSyncIntervalMs, getAutoSyncProgress } from "./auto-sync-schedule"

const lastSyncedAt = "2026-11-02T12:00:00.000Z"
const lastSynced = Date.parse(lastSyncedAt)

describe("getAutoSyncProgress", () => {
  it("returns null when there has never been a sync", () => {
    expect(getAutoSyncProgress(null, lastSynced)).toBeNull()
  })

  it("returns null for an unparsable timestamp", () => {
    expect(getAutoSyncProgress("not a date", lastSynced)).toBeNull()
  })

  it("reports the elapsed share of the interval and when the next sync is due", () => {
    expect(
      getAutoSyncProgress(lastSyncedAt, lastSynced + autoSyncIntervalMs / 4)
    ).toEqual({
      fraction: 0.25,
      nextSyncAt: lastSynced + autoSyncIntervalMs,
    })
  })

  it("clamps to a full interval once a sync is overdue", () => {
    expect(
      getAutoSyncProgress(lastSyncedAt, lastSynced + 2 * autoSyncIntervalMs)
        ?.fraction
    ).toBe(1)
  })

  it("clamps to zero when the clock is behind the last sync", () => {
    expect(getAutoSyncProgress(lastSyncedAt, lastSynced - 1000)?.fraction).toBe(
      0
    )
  })
})
