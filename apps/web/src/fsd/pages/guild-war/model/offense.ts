import { progressionRarity, rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import type { Team, TeamRoster } from "@/entities/team"

import type { GuildWarAttack, GuildWarLineupUnit } from "./types"

export type UnitKind = "character" | "mow"

/** The picked units in the order they were picked: id → kind. */
export type Selection = ReadonlyMap<string, UnitKind>

/** The lineup limits of one attack, as the API checks them. No minimum beyond one character: the
 *  game's 3-unit lineup minimum is game-wide and not confirmed for Guild War. */
export const MAX_ATTACK_CHARACTERS = 5
export const MAX_ATTACK_MOWS = 1

/** Whether the selection holds as many units of a kind as an attack takes, so no other unit of that
 *  kind can be picked. */
export function kindFull(selection: Selection, kind: UnitKind): boolean {
  const count = [...selection.values()].filter((entry) => entry === kind).length
  return (
    count >= (kind === "character" ? MAX_ATTACK_CHARACTERS : MAX_ATTACK_MOWS)
  )
}

/** The selection with a unit added or removed; adding one of a full kind leaves it as it is. */
export function toggleSelection(
  selection: Selection,
  unitId: string,
  kind: UnitKind
): Selection {
  const next = new Map(selection)
  if (next.has(unitId)) next.delete(unitId)
  else if (!kindFull(selection, kind)) next.set(unitId, kind)
  return next
}

/** How many available characters show before "Show all": a desktop's few rows, a phone's four. */
export const CHARACTER_PREVIEW = { desktop: 30, phone: 12 } as const

/** The characters to show: all of them once expanded or narrowed by a search or a filter, else the
 *  first `limit`; `hidden` counts the rest. */
export function previewCharacters<T>(
  characters: readonly T[],
  {
    expanded,
    narrowed,
    limit,
  }: { expanded: boolean; narrowed: boolean; limit: number }
): { shown: readonly T[]; hidden: number } {
  if (expanded || narrowed || characters.length <= limit) {
    return { shown: characters, hidden: 0 }
  }
  return {
    shown: characters.slice(0, limit),
    hidden: characters.length - limit,
  }
}

/** Where each deployed unit went: its zone in the war's last attack with it. */
export function deployedZones(
  attacks: readonly GuildWarAttack[]
): ReadonlyMap<string, string> {
  const zones = new Map<string, string>()
  for (const attack of attacks) {
    for (const unit of [
      ...attack.characters,
      ...(attack.mow ? [attack.mow] : []),
    ]) {
      zones.set(unit.unitId, attack.zoneId)
    }
  }
  return zones
}

/** A team's core: its characters and MoWs before the flex ones, which an attack starts with. */
export function coreUnits(team: Team): { id: string; kind: UnitKind }[] {
  const characters = team.characterIds.slice(
    0,
    team.flexStartIndex ?? team.characterIds.length
  )
  const mows = team.mowIds.slice(
    0,
    team.mowFlexStartIndex ?? team.mowIds.length
  )
  return [
    ...characters.map((id) => ({ id, kind: "character" as const })),
    ...mows.map((id) => ({ id, kind: "mow" as const })),
  ]
}

/** An offense team and the first of its core units that already attacked (null when ready). */
export interface OffenseTeam {
  team: Team
  blockedBy: { id: string; kind: UnitKind } | null
}

/** The War Offense teams in their saved order, the ready ones first and the blocked ones after. */
export function offenseTeams(
  teams: readonly Team[],
  deployed: ReadonlySet<string>
): OffenseTeam[] {
  const withStatus = teams
    .filter((team) => team.modes.includes("warOffense"))
    .map((team) => ({
      team,
      blockedBy: coreUnits(team).find((unit) => deployed.has(unit.id)) ?? null,
    }))
  return [
    ...withStatus.filter((entry) => entry.blockedBy === null),
    ...withStatus.filter((entry) => entry.blockedBy !== null),
  ]
}

/** Why the selection cannot be logged yet, first reason first; null when it can. */
export type LogBlock =
  | { reason: "noCharacter" }
  | { reason: "tooManyCharacters" }
  | { reason: "tooManyMows" }
  | { reason: "deployed"; unitId: string; kind: UnitKind }
  | { reason: "notOwned"; unitId: string; kind: UnitKind }
  | { reason: "noTokens" }
  | { reason: "noLevel" }
  | { reason: "noZone" }

export function logBlock({
  selection,
  deployed,
  roster,
  tokensLeft,
  levelPicked,
  hasTarget,
}: {
  selection: Selection
  deployed: ReadonlySet<string>
  roster: TeamRoster | null
  tokensLeft: number
  /** Whether a battlefield level is picked for this war. */
  levelPicked: boolean
  /** Whether the page has a zone and defenders' rarity to log at. */
  hasTarget: boolean
}): LogBlock | null {
  const picked = [...selection]
  const characters = picked.filter(([, kind]) => kind === "character").length
  if (characters === 0) return { reason: "noCharacter" }
  if (characters > MAX_ATTACK_CHARACTERS) return { reason: "tooManyCharacters" }
  if (picked.length - characters > MAX_ATTACK_MOWS) {
    return { reason: "tooManyMows" }
  }
  const used = picked.find(([id]) => deployed.has(id))
  if (used) return { reason: "deployed", unitId: used[0], kind: used[1] }
  const missing = picked.find(([id, kind]) => !rosterUnit(roster, kind, id))
  if (missing) {
    return { reason: "notOwned", unitId: missing[0], kind: missing[1] }
  }
  if (tokensLeft <= 0) return { reason: "noTokens" }
  if (!levelPicked) return { reason: "noLevel" }
  return hasTarget ? null : { reason: "noZone" }
}

function rosterUnit(roster: TeamRoster | null, kind: UnitKind, id: string) {
  return (kind === "character" ? roster?.characters : roster?.mows)?.get(id)
}

/** A picked unit as the attack stores it: its progression, rank, level and abilities from the
 *  synced roster (not capped: the attack keeps the cap beside it). */
export function lineupUnit(
  roster: TeamRoster | null,
  kind: UnitKind,
  unitId: string
): GuildWarLineupUnit | null {
  const unit = rosterUnit(roster, kind, unitId)
  if (!unit) return null
  return {
    unitId,
    progression: unit.progression,
    rank: kind === "character" ? (unit.rank ?? null) : null,
    xpLevel: unit.xpLevel ?? 0,
    abilityLevels: [...unit.abilityLevels],
  }
}

/** The characters the player still has for this war, counted by their own rarity, highest first;
 *  rarities with none are left out. */
export function charactersLeftByRarity(
  roster: TeamRoster | null,
  deployed: ReadonlySet<string>
): { rarity: Rarity; count: number }[] {
  const counts = new Map<Rarity, number>()
  for (const [id, unit] of roster?.characters ?? []) {
    if (deployed.has(id)) continue
    const rarity = progressionRarity(unit.progression)
    counts.set(rarity, (counts.get(rarity) ?? 0) + 1)
  }
  return rarityOrder.toReversed().flatMap((rarity) => {
    const count = counts.get(rarity) ?? 0
    return count > 0 ? [{ rarity, count }] : []
  })
}
