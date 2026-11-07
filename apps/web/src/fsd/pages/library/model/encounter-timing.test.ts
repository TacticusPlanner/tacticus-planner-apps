import { describe, expect, it } from "vitest"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"

import { encounterTiming } from "./encounter-timing"

const now = Date.parse("2026-11-03T12:00:00Z")

const entry = (
  definitionId: string,
  startUtc: string,
  endUtc: string,
  parameters: Record<string, unknown> | null,
  confirmed = true
): EventsCalendarStorageModel => ({
  id: `${definitionId}-${startUtc}`,
  date: startUtc.slice(0, 10),
  occurrenceId: confirmed ? `occ-${startUtc}` : null,
  definitionId,
  confirmed,
  startUtc,
  endUtc,
  parameters,
})

const calendar = [
  entry("legendary-event", "2026-11-08T00:00:00Z", "2026-11-15T00:00:00Z", {
    featuredCharacterId: "lostaBile",
  }),
  entry("legendary-event", "2026-12-20T00:00:00Z", "2026-12-27T00:00:00Z", {
    featuredCharacterId: "lostaBile",
  }),
  // A regular (non-debut) Incursion week, as the calendar serves it: no featuredMowId.
  entry("incursion", "2026-11-02T08:00:00Z", "2026-11-07T08:00:00Z", {
    newContentDebut: false,
  }),
  // A projected placeholder carries no parameters, so it never names a group.
  entry("quest", "2026-11-01T00:00:00Z", "2026-11-30T00:00:00Z", null, false),
]

describe("encounterTiming", () => {
  it("reads a running incursion for every MoW, featured or not", () => {
    for (const mowId of ["tauBroadside", "tyranBiovore"]) {
      expect(encounterTiming("incursion", mowId, calendar, now)).toEqual({
        kind: "running",
      })
    }
  })

  it("ends a running incursion at its exact end time", () => {
    const atEnd = Date.parse("2026-11-07T08:00:00Z")
    expect(
      encounterTiming("incursion", "tauBroadside", calendar, atEnd)
    ).toEqual({ kind: "none" })
  })

  it("picks the earliest future run", () => {
    expect(
      encounterTiming("legendaryEvent", "lostaBile", calendar, now)
    ).toEqual({ kind: "next", startMs: Date.parse("2026-11-08T00:00:00Z") })
  })

  it("says none when no entry names the group", () => {
    expect(
      encounterTiming("legendaryEvent", "astarLysander", calendar, now)
    ).toEqual({ kind: "none" })
  })

  it("never matches a placeholder without parameters", () => {
    expect(encounterTiming("questEvent", "astarCyrus", calendar, now)).toEqual({
      kind: "none",
    })
  })

  it("treats campaigns and Onslaught as always available", () => {
    expect(encounterTiming("campaign", "campaign1", null, now)).toEqual({
      kind: "always",
    })
    expect(encounterTiming("onslaught", "onslaught", null, now)).toEqual({
      kind: "always",
    })
  })

  it("treats unscheduled rotating sources as rotating", () => {
    for (const source of ["campaignEvent", "guildRaid", "survival"] as const) {
      expect(encounterTiming(source, "x", calendar, now)).toEqual({
        kind: "rotating",
      })
    }
  })

  it("has no answer for a scheduled source while the calendar is missing", () => {
    expect(encounterTiming("incursion", "tauBroadside", null, now)).toBeNull()
  })
})
