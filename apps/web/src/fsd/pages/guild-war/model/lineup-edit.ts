import type { TeamRoster } from "@/entities/team"
import type { PickerUnit } from "@/features/team-editor"

import { kindFull, lineupUnit } from "./offense"
import type { Selection, UnitKind } from "./offense"
import type { GuildWarAttack, GuildWarLineupUnit } from "./types"

/** Every unit of a logged attack, characters first. */
function attackUnits(
  attack: GuildWarAttack
): { unit: GuildWarLineupUnit; kind: UnitKind }[] {
  return [
    ...attack.characters.map((unit) => ({ unit, kind: "character" as const })),
    ...(attack.mow ? [{ unit: attack.mow, kind: "mow" as const }] : []),
  ]
}

/** A logged attack's lineup as picks (id → kind), characters first. */
export function attackPicks(attack: GuildWarAttack): Selection {
  return new Map(
    attackUnits(attack).map(({ unit, kind }) => [unit.unitId, kind])
  )
}

/** The unit an attack logged under this id, kept as logged when it stays in the lineup. */
export function loggedUnit(
  attack: GuildWarAttack | null,
  unitId: string
): GuildWarLineupUnit | undefined {
  if (!attack) return undefined
  return attackUnits(attack).find(({ unit }) => unit.unitId === unitId)?.unit
}

/**
 * The lineup an edited attack saves: units it already logged keep their logged progression, and
 * units added in the dialog take theirs from the roster (a unit the roster lacks is left out).
 */
export function editedLineup(
  attack: GuildWarAttack,
  picks: Selection,
  roster: TeamRoster | null
): { characters: GuildWarLineupUnit[]; mow: GuildWarLineupUnit | null } {
  const units = [...picks].flatMap(([id, kind]) => {
    const unit = loggedUnit(attack, id) ?? lineupUnit(roster, kind, id)
    return unit ? [{ kind, unit }] : []
  })
  return {
    characters: units
      .filter((entry) => entry.kind === "character")
      .map((entry) => entry.unit),
    mow: units.find((entry) => entry.kind === "mow")?.unit ?? null,
  }
}

/** The units that attacked in this war other than in the attack being edited: none of them can
 *  join its lineup. */
export function takenByOtherAttacks(
  deployed: ReadonlySet<string>,
  editing: GuildWarAttack | null
): ReadonlySet<string> {
  if (!editing) return deployed
  const own = new Set(attackUnits(editing).map(({ unit }) => unit.unitId))
  return new Set([...deployed].filter((id) => !own.has(id)))
}

/**
 * The owned units of a kind the dialog can add to the lineup: not in it already, not used by
 * another attack of the war, and none while the lineup holds as many of that kind as an attack takes.
 */
export function addableUnits(
  units: readonly PickerUnit[],
  kind: UnitKind,
  picks: Selection,
  taken: ReadonlySet<string>
): PickerUnit[] {
  if (kindFull(picks, kind)) return []
  return units.filter(
    (unit) =>
      unit.kind === kind &&
      unit.owned === true &&
      !picks.has(unit.id) &&
      !taken.has(unit.id)
  )
}

/** Whether the lineup can be saved: an attack needs at least one character. */
export function lineupHasCharacter(picks: Selection): boolean {
  return [...picks.values()].includes("character")
}
