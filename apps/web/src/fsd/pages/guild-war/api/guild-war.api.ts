import { apiClient, unwrap } from "@/shared/api"

import type {
  GuildWar,
  GuildWarAttackFields,
  GuildWarSettings,
  PastGuildWars,
} from "../model/types"

/** How many past wars one page holds. */
const PAST_WARS_PAGE_SIZE = 20

/** The caller's current war, or null when they have none. */
export function getCurrentWar(signal?: AbortSignal): Promise<GuildWar | null> {
  return unwrap(apiClient().GET("/api/v1/guild-wars/current", { signal })).then(
    (response) => response.war
  )
}

/** Creates the current war when there is none (`revision` ignored), else changes its season and
 *  level. 400 `guildWarUnknownSeason` or `guildWarUnknownLevel`; 409 `guildWarRevisionStale` with
 *  the war as it stands. */
export function setCurrentWar(
  settings: GuildWarSettings,
  revision: number
): Promise<GuildWar> {
  return unwrap(
    apiClient().PUT("/api/v1/guild-wars/current", {
      body: { ...settings, revision },
    })
  )
}

/** Ends the current war (kept, with its attacks) and starts a new one with no attacks. */
export function startWar(settings: GuildWarSettings): Promise<GuildWar> {
  return unwrap(apiClient().POST("/api/v1/guild-wars", { body: settings }))
}

/** One page of ended wars, newest first; `after` is the previous page's `nextAfter`. */
export function listPastWars(
  after: string | null,
  signal?: AbortSignal
): Promise<PastGuildWars> {
  return unwrap(
    apiClient().GET("/api/v1/guild-wars", {
      params: { query: { after, limit: PAST_WARS_PAGE_SIZE } },
      signal,
    })
  )
}

/** Logs an attack in the current war and answers the war. 400 with the first rule it breaks;
 *  409 `guildWarNotStarted` when there is no current war. */
export function createAttack(fields: GuildWarAttackFields): Promise<GuildWar> {
  return unwrap(
    apiClient().POST("/api/v1/guild-wars/current/attacks", {
      body: { ...fields, attackedAt: null },
    })
  )
}

/** Removes an attack (Undo) and answers its war. */
export function deleteAttack(
  warId: string,
  attackId: string
): Promise<GuildWar> {
  return unwrap(
    apiClient().DELETE("/api/v1/guild-wars/{warId}/attacks/{attackId}", {
      params: { path: { warId, attackId } },
    })
  )
}
