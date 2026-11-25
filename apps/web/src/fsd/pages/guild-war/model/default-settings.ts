import { DEFAULT_BATTLEFIELD_LEVEL } from "../lib/season"
import type { GuildWar, GuildWarSettings } from "./types"
import type { GuildWarSeason } from "../lib/season"

/** The war's own season and level; with no war, the first served season at the default level
 *  (the one a first attack or Settings starts the war with). Undefined while nothing is served. */
export function warSettings(
  war: GuildWar | null,
  seasons: readonly GuildWarSeason[]
): GuildWarSettings | undefined {
  if (war) {
    return { seasonId: war.seasonId, battlefieldLevel: war.battlefieldLevel }
  }
  const first = seasons[0]
  if (!first) return undefined
  const levels = first.levels.map((level) => level.battlefieldLevel)
  return {
    seasonId: first.id,
    battlefieldLevel: levels.includes(DEFAULT_BATTLEFIELD_LEVEL)
      ? DEFAULT_BATTLEFIELD_LEVEL
      : (levels.at(-1) ?? 0),
  }
}
