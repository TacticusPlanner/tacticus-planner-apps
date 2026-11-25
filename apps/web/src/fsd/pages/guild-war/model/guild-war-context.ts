import { useOutletContext } from "react-router"
import type { Rarity } from "@workspace/game-domain"

import type { AttackTarget } from "./attack-target"
import type { GuildWar, GuildWarSettings } from "./types"
import type { GuildWarSeason } from "../lib/season"

/** What the Guild War layout hands its tabs: the war, its season, and the target the page is
 *  capped at. */
export interface GuildWarContext {
  /** Null while the player has no current war: the page shows the defaults and the first logged
   *  attack starts one. */
  war: GuildWar | null
  /** The war's season (the default one with no war); undefined when the season is no longer
   *  served. */
  season: GuildWarSeason | undefined
  /** The war's season and level, or the defaults a first attack starts the war with. */
  settings: GuildWarSettings
  target: AttackTarget
  /** The cap of the picked zone and slot at the war's level; undefined (uncapped) until both are
   *  picked. */
  rarityCap: Rarity | undefined
}

export function useGuildWarContext() {
  return useOutletContext<GuildWarContext>()
}
