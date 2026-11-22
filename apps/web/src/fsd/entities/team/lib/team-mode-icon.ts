import {
  gameMenuIcon,
  gameModeTokenIcon,
  incursionTokenIcon,
} from "@workspace/game-catalog"

import type { TeamMode } from "../model/types"

/**
 * A mode's game icon, from the game's battle tokens where the mode spends one: both war modes
 * share Guild War's, Horde spends Survival's, Incursion the Machines of War token. Campaigns
 * spend energy, not a token, so they show the Battle tab's glyph.
 */
export function teamModeIcon(mode: TeamMode): string {
  switch (mode) {
    case "warOffense":
    case "warDefense": {
      return gameModeTokenIcon("guildWar")
    }
    case "guildRaid": {
      return gameModeTokenIcon("guildRaid")
    }
    case "tournamentArena": {
      return gameModeTokenIcon("tournamentArena")
    }
    case "horde": {
      return gameModeTokenIcon("survival")
    }
    case "campaign": {
      return gameMenuIcon("battle")
    }
    case "incursion": {
      return incursionTokenIcon()
    }
  }
}
