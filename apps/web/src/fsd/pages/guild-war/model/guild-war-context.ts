import { useOutletContext } from "react-router"

import type { GuildWar, GuildWarSettings } from "./types"
import type { GuildWarSeason } from "../lib/season"

/** What the Guild War layout hands its tabs: the war and its season and level. */
export interface GuildWarContext {
  /** Null while the player has no current war: the page shows the defaults and the first logged
   *  attack starts one. */
  war: GuildWar | null
  /** The war's season (the default one with no war); undefined when the season is no longer
   *  served. */
  season: GuildWarSeason | undefined
  /** The war's season and level, or the defaults a first attack starts the war with. */
  settings: GuildWarSettings
}

export function useGuildWarContext() {
  return useOutletContext<GuildWarContext>()
}
