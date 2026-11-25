import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { capRosterUnit, teamUnitView } from "@/entities/team"
import type { TeamRoster, TeamUnitView } from "@/entities/team"

/** A unit as the page shows it under the slot's cap: its synced progression and rank, capped. */
export function cappedView(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null,
  cap: Rarity
): TeamUnitView {
  const view = teamUnitView(kind, unitId, roster)
  const entry = (kind === "character" ? roster?.characters : roster?.mows)?.get(
    unitId
  )
  if (!entry) return view
  const capped = capRosterUnit(entry, cap, progressionRarity)
  return { ...view, progression: capped.progression, rank: capped.rank }
}
