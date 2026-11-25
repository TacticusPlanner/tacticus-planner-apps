import type { TeamRoster } from "@/entities/team"

import { enemyFields } from "./enemy-draft"
import type { EnemyDraft } from "./enemy-draft"
import { lineupUnit } from "./offense"
import type { Selection } from "./offense"
import type { GuildWarAttackFields, GuildWarLineupUnit } from "./types"

/** The longest note an attack keeps (the API's limit). */
export const GUILD_WAR_NOTES_MAX = 200

export type ResultChoice = "none" | "won" | "lost"

/** The attack Log attack sends: the lineup from the roster, the zone and slot, the result with the
 *  lineup units lost (only with a result), the trimmed note (null when blank) and the enemy. */
export function attackFields({
  selection,
  roster,
  zoneId,
  slot,
  result,
  lostIds,
  notes,
  enemy,
}: {
  selection: Selection
  roster: TeamRoster | null
  zoneId: string
  slot: number
  result: ResultChoice
  lostIds: ReadonlySet<string>
  notes: string
  enemy: EnemyDraft
}): GuildWarAttackFields {
  const lineup = [...selection].flatMap(([id, kind]) => {
    const unit = lineupUnit(roster, kind, id)
    return unit ? [{ kind, unit }] : []
  })
  const ofKind = (kind: "character" | "mow"): GuildWarLineupUnit[] =>
    lineup.filter((entry) => entry.kind === kind).map((entry) => entry.unit)
  const note = notes.trim()
  return {
    zoneId,
    slot,
    characters: ofKind("character"),
    mow: ofKind("mow")[0] ?? null,
    result: result === "none" ? null : result,
    lostUnitIds:
      result === "none"
        ? null
        : lineup
            .map((entry) => entry.unit.unitId)
            .filter((id) => lostIds.has(id)),
    notes: note === "" ? null : note,
    enemy: enemyFields(enemy),
  }
}
