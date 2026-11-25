import { progressionRarity, rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import type { Team, TeamRoster } from "@/entities/team"

import type { GuildWarLineupUnit } from "./types"

export type UnitKind = "character" | "mow"

/** The picked units in the order they were picked: id → kind. */
export type Selection = ReadonlyMap<string, UnitKind>

/** The lineup limits of one attack, as the API checks them. */
const MAX_ATTACK_CHARACTERS = 5
const MAX_ATTACK_MOWS = 1

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

export function logBlock({
  selection,
  deployed,
  roster,
  tokensLeft,
}: {
  selection: Selection
  deployed: ReadonlySet<string>
  roster: TeamRoster | null
  tokensLeft: number
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
  return tokensLeft > 0 ? null : { reason: "noTokens" }
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
