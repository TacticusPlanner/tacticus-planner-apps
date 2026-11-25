import { DEFAULT_BATTLEFIELD_LEVEL } from "../lib/season"
import type { GuildWar, GuildWarSettings } from "./types"
import type { GuildWarSeason } from "../lib/season"

/** A new war's season and level: the season the calendar says counts now (else the current one),
 *  keeping the current level when that season has it, else at its default level. */
export function newWarSettings(
  current: GuildWarSettings,
  seasons: readonly GuildWarSeason[],
  calendarSeasonId?: string
): GuildWarSettings {
  const season = seasons.find((entry) => entry.id === calendarSeasonId)
  if (!season || season.id === current.seasonId) return current
  const levels = season.levels.map((level) => level.battlefieldLevel)
  return levels.includes(current.battlefieldLevel)
    ? { seasonId: season.id, battlefieldLevel: current.battlefieldLevel }
    : (warSettings(null, [season], season.id) ?? current)
}

/** The war's own season and level; with no war, the season the calendar says is running (else the
 *  first served one) at the default level: what a first attack or Settings starts the war with.
 *  Undefined while nothing is served. */
export function warSettings(
  war: GuildWar | null,
  seasons: readonly GuildWarSeason[],
  calendarSeasonId?: string
): GuildWarSettings | undefined {
  if (war) {
    return { seasonId: war.seasonId, battlefieldLevel: war.battlefieldLevel }
  }
  const first =
    seasons.find((season) => season.id === calendarSeasonId) ?? seasons[0]
  if (!first) return undefined
  const levels = first.levels.map((level) => level.battlefieldLevel)
  return {
    seasonId: first.id,
    battlefieldLevel: levels.includes(DEFAULT_BATTLEFIELD_LEVEL)
      ? DEFAULT_BATTLEFIELD_LEVEL
      : (levels.at(-1) ?? 0),
  }
}
