import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { teamUnitView, capRosterUnit } from "@/entities/team"
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
export function cappedRosterUnit(
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
