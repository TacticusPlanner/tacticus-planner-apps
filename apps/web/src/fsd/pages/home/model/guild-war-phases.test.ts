import { describe, expect, it } from "vitest"

import { guildWarLiveAndNext } from "./guild-war-phases"
import type { RawEventDefinition } from "./events-calendar.types"

const season29 = {
  definitionId: "guild-war-season",
  startUtc: "2026-11-27T09:00:00Z",
  endUtc: "2026-12-12T09:00:00Z",
  parameters: { season: 29, seasonConfigId: "guildWarSeasonC" },
}
const config = {
  warsPerSeason: 6,
  preparationPhaseHours: 24,
  activeFightingPhaseHours: 36,
}
const definition = {
  id: "guild-war-season",
  type: "GuildWarSeason",
  recurrence: null,
  config,
} as unknown as RawEventDefinition
const at = (iso: string) => Date.parse(iso)

describe("guildWarLiveAndNext", () => {
  const entries = [season29, season29]

  it("has the season's first preparation before it starts", () => {
    const { live, next } = guildWarLiveAndNext(
      entries,
      definition,
      at("2026-11-26T12:00:00Z")
    )
    expect(live).toBeNull()
    expect(next).toEqual({
      phase: "preparation",
      war: 1,
      season: 29,
      startMs: at("2026-11-27T09:00:00Z"),
      endMs: at("2026-11-28T09:00:00Z"),
    })
  })

  it("opens the first war's preparation early by the first-war bonus, before the season starts", () => {
    const withBonus = {
      ...definition,
      config: { ...config, firstWarPreparationBonusHours: 48 },
    } as unknown as RawEventDefinition
    const { live, next } = guildWarLiveAndNext(
      entries,
      withBonus,
      at("2026-11-26T12:00:00Z")
    )
    // As in the game: War 1 preparation runs 72 hours, Nov 25 09:00 to Nov 28 09:00 UTC.
    expect(live).toEqual({
      phase: "preparation",
      war: 1,
      season: 29,
      startMs: at("2026-11-25T09:00:00Z"),
      endMs: at("2026-11-28T09:00:00Z"),
    })
    // Later wars keep their own 24-hour preparation.
    expect(next).toMatchObject({
      phase: "war",
      war: 1,
      startMs: at("2026-11-28T09:00:00Z"),
    })
    expect(
      guildWarLiveAndNext(entries, withBonus, at("2026-11-29T22:00:00Z")).live
    ).toMatchObject({
      phase: "preparation",
      war: 2,
      startMs: at("2026-11-29T21:00:00Z"),
      endMs: at("2026-11-30T21:00:00Z"),
    })
  })

  it("has the running war phase and the next war's preparation", () => {
    const { live, next } = guildWarLiveAndNext(
      entries,
      definition,
      at("2026-11-29T12:00:00Z")
    )
    expect(live).toMatchObject({
      phase: "war",
      war: 1,
      startMs: at("2026-11-28T09:00:00Z"),
      endMs: at("2026-11-29T21:00:00Z"),
    })
    expect(next).toMatchObject({
      phase: "preparation",
      war: 2,
      startMs: at("2026-11-29T21:00:00Z"),
    })
  })

  it("ends the last war with the season", () => {
    const { live, next } = guildWarLiveAndNext(
      entries,
      definition,
      at("2026-12-12T08:00:00Z")
    )
    expect(live).toMatchObject({
      phase: "war",
      war: 6,
      endMs: at("2026-12-12T09:00:00Z"),
    })
    expect(next).toBeNull()
  })

  it("has nothing after the last season, or without the definition", () => {
    expect(
      guildWarLiveAndNext(entries, definition, at("2026-12-20T00:00:00Z"))
    ).toEqual({ live: null, next: null })
    expect(
      guildWarLiveAndNext(entries, undefined, at("2026-11-26T12:00:00Z"))
    ).toEqual({ live: null, next: null })
  })
})
