import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { teamUnitView, capRosterUnit, underCap } from "@/entities/team"
import type { TeamRoster, TeamUnitView } from "@/entities/team"

/** A unit as the lineup and the picker show it under the rarity cap. */
export function cappedView(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null,
  cap: Rarity
): TeamUnitView {
  const view = teamUnitView(kind, unitId, roster)
  const entry = roster
    ? (kind === "character" ? roster.characters : roster.mows).get(unitId)
    : undefined
  if (!entry) return view
  const capped = capRosterUnit(entry, cap, progressionRarity)
  return { ...view, progression: capped.progression, rank: capped.rank }
}

/** The synced unit as it shows under the cap, or undefined when it is not owned or not synced. */
function cappedRosterUnit(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null,
  cap: Rarity
) {
  const entry = roster
    ? (kind === "character" ? roster.characters : roster.mows).get(unitId)
    : undefined
  return entry ? capRosterUnit(entry, cap, progressionRarity) : undefined
}

/**
 * A lineup unit under the cap: the synced unit as it shows there and what of it is under the cap,
 * both undefined when the unit is not owned or not synced.
 */
export function lineupUnitCap(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null,
  cap: Rarity
) {
  const owned = roster
    ? (kind === "character" ? roster.characters : roster.mows).get(unitId)
    : undefined
  return {
    capped: cappedRosterUnit(kind, unitId, roster, cap),
    under: owned ? underCap(owned, cap, progressionRarity) : undefined,
  }
}
