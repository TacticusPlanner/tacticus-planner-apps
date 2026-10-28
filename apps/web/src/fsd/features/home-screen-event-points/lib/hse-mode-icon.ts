import { gameModeTokenIcon } from "@workspace/game-catalog"

import type { HseTokenMode } from "./hse-token-supply"

/** A token mode's battle token, as the game draws it (Tournament Arena spends Arena's). */
export function hseModeIcon(mode: HseTokenMode): string {
  switch (mode) {
    case "Arena":
    case "TournamentArena": {
      return gameModeTokenIcon("arena")
    }
    case "Onslaught": {
      return gameModeTokenIcon("onslaught")
    }
    case "SalvageRun": {
      return gameModeTokenIcon("salvageRun")
    }
  }
}
