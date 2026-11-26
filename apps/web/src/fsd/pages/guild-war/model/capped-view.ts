import { progressionRarity, rankOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { capRosterUnit, teamUnitView } from "@/entities/team"
import type { TeamRoster, TeamUnitView } from "@/entities/team"

import type { GuildWarLineupUnit } from "./types"

/** A unit as the page shows it under the defenders' cap: its synced progression and rank, capped.
 *  With no cap (no zone picked yet) it shows as synced. */
export function cappedView(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null,
  cap: Rarity | undefined
): TeamUnitView {
  const view = teamUnitView(kind, unitId, roster)
  const entry = (kind === "character" ? roster?.characters : roster?.mows)?.get(
    unitId
  )
  if (!entry || !cap) return view
  const capped = capRosterUnit(entry, cap, progressionRarity)
  return { ...view, progression: capped.progression, rank: capped.rank }
}

/** A logged lineup unit as it fought: its progression and rank as logged, capped at `cap`. */
export function lineupUnitView(
  kind: TeamUnitView["kind"],
  unit: GuildWarLineupUnit,
  cap: Rarity
): TeamUnitView {
  const capped = capRosterUnit(
    {
      progression: unit.progression,
      // A rank the app does not know yet (Adamantine 3) shows no badge.
      rank: rankOrder.find((rank) => rank === unit.rank),
      xpLevel: unit.xpLevel,
      abilityLevels: [unit.abilityLevels[0] ?? 0, unit.abilityLevels[1] ?? 0],
    },
    cap,
    progressionRarity
  )
  return {
    kind,
    unitId: unit.unitId,
    owned: true,
    progression: capped.progression,
    rank: capped.rank,
  }
}
