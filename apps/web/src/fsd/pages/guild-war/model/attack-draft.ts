import type { TeamRoster } from "@/entities/team"

import { EMPTY_ENEMY, enemyDraft, enemyFields } from "./enemy-draft"
import type { EnemyDraft } from "./enemy-draft"
import { lineupUnit } from "./offense"
import type { Selection } from "./offense"
import type {
  GuildWarAttack,
  GuildWarAttackFields,
  GuildWarLineupUnit,
} from "./types"

/** The longest note an attack keeps (the API's limit). */
export const GUILD_WAR_NOTES_MAX = 200

type ResultChoice = "none" | "won" | "lost"

/** What the Log attack dialog edits beside the lineup and target. */
export interface AttackDetails {
  result: ResultChoice
  lostIds: ReadonlySet<string>
  notes: string
  enemy: EnemyDraft
}

/** Nothing noted: no result, no units lost, no note and no enemy. */
export const NO_DETAILS: AttackDetails = {
  result: "none",
  lostIds: new Set(),
  notes: "",
  enemy: EMPTY_ENEMY,
}

/** The details an attack was logged with, for Edit. */
export function attackDetails(attack: GuildWarAttack): AttackDetails {
  return {
    result: attack.result ?? "none",
    lostIds: new Set(attack.lostUnitIds ?? []),
    notes: attack.notes ?? "",
    enemy: enemyDraft(attack.enemy),
  }
}

/** The fields an attack is saved with from its lineup, target and details: the units lost only
 *  with a result (in lineup order), the trimmed note (null when blank) and the enemy (null when
 *  none was entered). */
function fieldsOf(
  characters: GuildWarLineupUnit[],
  mow: GuildWarLineupUnit | null,
  target: { zoneId: string; slot: number },
  { result, lostIds, notes, enemy }: AttackDetails
): GuildWarAttackFields {
  const lineupIds = [...characters, ...(mow ? [mow] : [])].map(
    (unit) => unit.unitId
  )
  const note = notes.trim()
  return {
    zoneId: target.zoneId,
    slot: target.slot,
    characters,
    mow,
    result: result === "none" ? null : result,
    lostUnitIds:
      result === "none" ? null : lineupIds.filter((id) => lostIds.has(id)),
    notes: note === "" ? null : note,
    enemy: enemyFields(enemy),
  }
}

/** A new attack: the lineup from the roster (as synced, the cap is stored beside it), the zone and
 *  slot, and its details. */
export function attackFields({
  selection,
  roster,
  zoneId,
  slot,
  details,
}: {
  selection: Selection
  roster: TeamRoster | null
  zoneId: string
  slot: number
  details: AttackDetails
}): GuildWarAttackFields {
  const lineup = [...selection].flatMap(([id, kind]) => {
    const unit = lineupUnit(roster, kind, id)
    return unit ? [{ kind, unit }] : []
  })
  const ofKind = (kind: "character" | "mow"): GuildWarLineupUnit[] =>
    lineup.filter((entry) => entry.kind === kind).map((entry) => entry.unit)
  return fieldsOf(
    ofKind("character"),
    ofKind("mow")[0] ?? null,
    { zoneId, slot },
    details
  )
}

/** An edited attack: its lineup (as logged unless changed, `editedLineup`), the (possibly changed)
 *  zone and slot, and its details. */
export function editedAttackFields(
  attack: GuildWarAttack,
  target: { zoneId: string; slot: number },
  details: AttackDetails,
  lineup: {
    characters: readonly GuildWarLineupUnit[]
    mow: GuildWarLineupUnit | null
  } = attack
): GuildWarAttackFields {
  return fieldsOf([...lineup.characters], lineup.mow, target, details)
}
