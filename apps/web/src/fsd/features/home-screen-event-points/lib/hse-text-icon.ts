import { isPlayableAlliance } from "@workspace/game-domain"
import {
  factionIcon,
  onslaughtAllianceIcon,
  traitIcon,
} from "@workspace/game-catalog"

import { HSE_TOKEN_MODES } from "@/entities/home-screen-event"
import type { HseTokenMode } from "@/entities/home-screen-event"

import { hseModeIcon } from "./hse-mode-icon"

const MODE_PREFIX = "dailies:hse.details.modes."

const isTokenMode = (id: string): id is HseTokenMode =>
  (HSE_TOKEN_MODES as readonly string[]).includes(id)

/**
 * The game icon for a label inside an event description line, by the label's i18n key: a faction,
 * an alliance, a trait, or a token game mode. Undefined for every other text.
 */
export function hseTextIcon(key: string): string | undefined {
  if (key.startsWith("factions:")) return factionIcon(key.slice(9))
  if (key.startsWith("traits:")) return traitIcon(key.slice(7))
  if (key.startsWith("common:alliances.")) {
    const alliance = key.slice(17)
    return isPlayableAlliance(alliance)
      ? onslaughtAllianceIcon(alliance)
      : undefined
  }
  if (key.startsWith(MODE_PREFIX)) {
    const mode = key.slice(MODE_PREFIX.length)
    return isTokenMode(mode) ? hseModeIcon(mode) : undefined
  }
  return undefined
}
