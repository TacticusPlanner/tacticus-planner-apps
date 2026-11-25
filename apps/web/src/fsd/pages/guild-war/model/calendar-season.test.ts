import { describe, expect, it } from "vitest"

import { calendarSeasonId, calendarSeasonNumber } from "./calendar-season"

const row = (
  startUtc: string,
  endUtc: string,
  seasonConfigId?: string,
  season?: number
) => ({
  definitionId: "guild-war-season",
  startUtc,
  endUtc,
  parameters: seasonConfigId ? { season, seasonConfigId } : null,
})

const served = new Set(["guildWarSeasonA", "guildWarSeasonC"])
// Between season 28 (ended 7 Nov) and season 29 (starts 27 Nov).
const now = Date.parse("2026-11-25T12:00:00Z")
const season28 = row(
  "2026-10-23T09:00:00Z",
  "2026-11-07T09:00:00Z",
  "guildWarSeasonC",
  28
)
const season29 = row(
  "2026-11-27T09:00:00Z",
  "2026-12-12T09:00:00Z",
  "guildWarSeasonC",
  29
)

describe("calendarSeasonId", () => {
  it("takes the season running now", () => {
    expect(
      calendarSeasonId(
        [
          row(
            "2026-11-20T09:00:00Z",
            "2026-12-05T09:00:00Z",
            "guildWarSeasonA"
          ),
          season29,
        ],
        served,
        now
      )
    ).toBe("guildWarSeasonA")
  })

  it("takes the next season between seasons, else the last one", () => {
    expect(
      calendarSeasonId(
        [
          row(
            "2026-09-18T09:00:00Z",
            "2026-10-03T09:00:00Z",
            "guildWarSeasonA"
          ),
          season29,
        ],
        served,
        now
      )
    ).toBe("guildWarSeasonC")
    expect(calendarSeasonId([season28], served, now)).toBe("guildWarSeasonC")
  })

  it("skips unnamed and unserved configs", () => {
    expect(
      calendarSeasonId(
        [
          row("2026-11-20T09:00:00Z", "2026-12-05T09:00:00Z"),
          row(
            "2026-11-20T09:00:00Z",
            "2026-12-05T09:00:00Z",
            "guildWarSeasonZ"
          ),
          {
            ...row(
              "2026-11-20T09:00:00Z",
              "2026-12-05T09:00:00Z",
              "guildWarSeasonA"
            ),
            definitionId: "other",
          },
        ],
        served,
        now
      )
    ).toBeUndefined()
    expect(calendarSeasonId([], served, now)).toBeUndefined()
  })
})

describe("calendarSeasonNumber", () => {
  it("numbers a war by the season of its config that counts when it started", () => {
    const rows = [season28, season29]
    expect(
      calendarSeasonNumber(
        rows,
        "guildWarSeasonC",
        Date.parse("2026-10-30T12:00:00Z")
      )
    ).toBe(28)
    // Between seasons the coming one counts.
    expect(calendarSeasonNumber(rows, "guildWarSeasonC", now)).toBe(29)
    expect(calendarSeasonNumber(rows, "guildWarSeasonA", now)).toBeUndefined()
  })
})
