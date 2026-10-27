import { describe, expect, it } from "vitest"

import { resolveSeasonWindows } from "./season-windows"

const NOW = Date.parse("2026-10-27T12:00:00Z")

const battlePass = {
  id: "battle-pass",
  recurrence: {
    kind: "Fixed" as const,
    intervalDays: 35,
    durationDays: 34,
    anchorUtc: "2026-08-02T00:00:00Z",
  },
  config: { seasonLengthDays: 35, seasonNumberAtAnchor: 40 },
}

const guildWar = {
  id: "guild-war-season",
  recurrence: {
    kind: "Fixed" as const,
    intervalDays: 35,
    durationDays: 15,
    anchorUtc: "2026-08-15T00:00:00Z",
  },
  config: { seasonNumberAtAnchor: 26 },
}

const guildRaid = {
  id: "guild-raid-season",
  recurrence: {
    kind: "None" as const,
    intervalDays: null,
    durationDays: null,
    anchorUtc: null,
  },
  config: { seasonLengthDays: 13 },
}

function occurrence(
  definitionId: string,
  startUtc: string,
  endUtc: string,
  parameters: Record<string, unknown> | null = null,
  occurrenceId: string | null = `occ-${definitionId}-${startUtc}`
) {
  return { definitionId, occurrenceId, startUtc, endUtc, parameters }
}

const iso = (ms: number) => new Date(ms).toISOString()

describe("resolveSeasonWindows", () => {
  it("projects Battle Pass cycles from the anchor (spec worked example)", () => {
    const windows = resolveSeasonWindows(battlePass, [], NOW)

    expect(windows?.seasonNumber).toBe(42)
    expect(windows?.boundariesMs.map(iso)).toEqual([
      "2026-11-15T00:00:00.000Z",
      "2026-12-20T00:00:00.000Z",
      "2027-01-24T00:00:00.000Z",
    ])
  })

  it("uses an authored Guild War occurrence for its slot and reads its season", () => {
    const windows = resolveSeasonWindows(
      guildWar,
      [
        occurrence(
          "guild-war-season",
          "2026-10-24T00:00:00Z",
          "2026-11-08T00:00:00Z",
          { season: 28 }
        ),
      ],
      NOW
    )

    expect(windows?.seasonNumber).toBe(28)
    expect(iso(windows!.boundariesMs[0]!)).toBe("2026-11-28T00:00:00.000Z")
  })

  it("lets an authored start shift its slot's boundary", () => {
    const windows = resolveSeasonWindows(
      battlePass,
      [
        occurrence(
          "battle-pass",
          "2026-11-16T00:00:00Z",
          "2026-12-21T00:00:00Z"
        ),
      ],
      NOW
    )

    expect(iso(windows!.boundariesMs[0]!)).toBe("2026-11-16T00:00:00.000Z")
    expect(iso(windows!.boundariesMs[1]!)).toBe("2026-12-20T00:00:00.000Z")
  })

  it("moves to the previous cycle when an authored start for this cycle is later than now", () => {
    const windows = resolveSeasonWindows(
      battlePass,
      [
        occurrence(
          "battle-pass",
          "2026-10-28T00:00:00Z",
          "2026-12-02T00:00:00Z"
        ),
      ],
      NOW
    )

    expect(windows?.seasonNumber).toBe(41)
    expect(iso(windows!.boundariesMs[0]!)).toBe("2026-10-28T00:00:00.000Z")
  })

  it("projects past the calendar's 15-week window", () => {
    const windows = resolveSeasonWindows(
      battlePass,
      [],
      Date.parse("2027-06-01T00:00:00Z")
    )

    expect(windows?.boundariesMs).toHaveLength(3)
    expect(windows?.seasonNumber).toBe(48)
  })

  it("ignores projected placeholders and other definitions", () => {
    const windows = resolveSeasonWindows(
      battlePass,
      [
        occurrence(
          "battle-pass",
          "2026-11-20T00:00:00Z",
          "2026-12-25T00:00:00Z",
          null,
          null
        ),
        occurrence(
          "guild-war-season",
          "2026-11-01T00:00:00Z",
          "2026-11-16T00:00:00Z"
        ),
      ],
      NOW
    )

    expect(iso(windows!.boundariesMs[0]!)).toBe("2026-11-15T00:00:00.000Z")
  })

  it("uses only authored occurrences for a non-recurring definition", () => {
    const windows = resolveSeasonWindows(
      guildRaid,
      [
        occurrence(
          "guild-raid-season",
          "2026-10-20T05:00:00Z",
          "2026-11-02T05:00:00Z",
          { season: 90 }
        ),
        occurrence(
          "guild-raid-season",
          "2026-11-03T05:00:00Z",
          "2026-11-16T05:00:00Z"
        ),
      ],
      NOW
    )

    expect(windows?.seasonNumber).toBe(90)
    expect(windows?.boundariesMs.map(iso)).toEqual([
      "2026-11-02T05:00:00.000Z",
      "2026-11-03T05:00:00.000Z",
    ])
  })

  it("returns null for a non-recurring definition with no current occurrence", () => {
    expect(resolveSeasonWindows(guildRaid, [], NOW)).toBeNull()
  })

  it("returns null for a missing definition or an invalid anchor", () => {
    expect(resolveSeasonWindows(undefined, [], NOW)).toBeNull()
    expect(
      resolveSeasonWindows(
        {
          ...battlePass,
          recurrence: { ...battlePass.recurrence, anchorUtc: "not a date" },
        },
        [],
        NOW
      )
    ).toBeNull()
  })

  it("omits the season number when the catalog carries none", () => {
    const windows = resolveSeasonWindows(
      { ...battlePass, config: null },
      [],
      NOW
    )

    expect(windows?.seasonNumber).toBeUndefined()
  })
})
