import { describe, expect, it } from "vitest"

import { calendarSeasonId } from "./calendar-season"

const row = (startUtc: string, seasonConfigId?: string) => ({
  definitionId: "guild-war-season",
  startUtc,
  parameters: seasonConfigId ? { season: 1, seasonConfigId } : null,
})

const served = new Set(["guildWarSeasonA", "guildWarSeasonC"])
const now = Date.parse("2026-11-25T12:00:00Z")

describe("calendarSeasonId", () => {
  it("takes the latest season started by now", () => {
    expect(
      calendarSeasonId(
        [
          row("2026-09-18T09:00:00Z", "guildWarSeasonA"),
          row("2026-10-23T09:00:00Z", "guildWarSeasonC"),
          row("2026-11-27T09:00:00Z", "guildWarSeasonA"),
        ],
        served,
        now
      )
    ).toBe("guildWarSeasonC")
  })

  it("falls back to the next season, and skips unnamed or unserved configs", () => {
    expect(
      calendarSeasonId(
        [
          row("2026-10-23T09:00:00Z"),
          row("2026-10-30T09:00:00Z", "guildWarSeasonZ"),
          {
            ...row("2026-11-01T09:00:00Z", "guildWarSeasonA"),
            definitionId: "other",
          },
          row("2026-11-27T09:00:00Z", "guildWarSeasonC"),
        ],
        served,
        now
      )
    ).toBe("guildWarSeasonC")
    expect(calendarSeasonId([], served, now)).toBeUndefined()
  })
})
