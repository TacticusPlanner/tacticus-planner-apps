import {
  battleGlyphIcon,
  damageTypeIcon,
  factionIcon,
  gameModeTokenIcon,
  onslaughtAllianceIcon,
  raidTicketIcon,
  statIcon,
  type OnslaughtAllianceIcon,
} from "@workspace/game-catalog"

import type { HreObjective } from "./hre-missions"

const ALLIANCES: ReadonlySet<string> = new Set<OnslaughtAllianceIcon>([
  "Imperial",
  "Chaos",
  "Xenos",
])

function allianceIcon(alliance: string | null): string | undefined {
  return alliance && ALLIANCES.has(alliance)
    ? onslaughtAllianceIcon(alliance as OnslaughtAllianceIcon)
    : undefined
}

/**
 * The game's glyph for what an objective counts: the mode's token for a mode objective, the
 * lightning laurel, the kill skull, the melee or ranged stat, the featured hero's alliance, the
 * faction or damage type it names. `alliance` is the featured hero's.
 */
export function hreObjectiveIcon(
  objective: HreObjective,
  alliance: string | null
): string | undefined {
  switch (objective.kind) {
    case "campaignWins": {
      return battleGlyphIcon("campaignBattle")
    }
    case "campaignRaids": {
      return raidTicketIcon()
    }
    case "arenaBattles": {
      return gameModeTokenIcon("arena")
    }
    case "guildRaids": {
      return gameModeTokenIcon("guildRaid")
    }
    case "onslaught": {
      return gameModeTokenIcon("onslaught")
    }
    case "salvageRuns": {
      return gameModeTokenIcon("salvageRun")
    }
    case "lightningVictories": {
      return battleGlyphIcon("lightningVictory")
    }
    case "killEnemies": {
      return battleGlyphIcon("kill")
    }
    case "killWithMelee": {
      return statIcon("melee")
    }
    case "killWithRanged": {
      return statIcon("ranged")
    }
    case "killWithAlliance":
    case "useAbilitiesAlliance":
    case "winWithAllianceLineup": {
      return allianceIcon(alliance) ?? battleGlyphIcon("kill")
    }
    case "killFaction": {
      return (
        (objective.qualifier && factionIcon(objective.qualifier)) ||
        battleGlyphIcon("kill")
      )
    }
    case "damage":
    case "featuredDamage": {
      return statIcon("damage")
    }
    case "damageType": {
      return objective.qualifier
        ? damageTypeIcon(objective.qualifier)
        : statIcon("damage")
    }
    case "abilityDamage":
    case "useAbilities":
    case "useAbilitiesFeatured": {
      return battleGlyphIcon("abilityUse")
    }
    case "heal": {
      return battleGlyphIcon("heal")
    }
    case "winWithoutSummons": {
      return battleGlyphIcon("summon")
    }
  }
}
