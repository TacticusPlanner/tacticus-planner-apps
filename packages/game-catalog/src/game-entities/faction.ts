import type { CharacterId, FactionId } from "./ids"

// Curated display order matching V1's data/factions.json (tacticusplanner/src/data/factions.json),
// with "Adeptus Astartes" (the generic chapter-less faction) moved to the end so it trails the
// named Space Marine chapters instead of sitting among them.
export const factionOrder: readonly FactionId[] = [
  "Ultramarines",
  "Sisterhood",
  "Necrons",
  "AstraMilitarum",
  "BlackLegion",
  "DeathGuard",
  "Orks",
  "BlackTemplars",
  "Aeldari",
  "Tau",
  "SpaceWolves",
  "ThousandSons",
  "DarkAngels",
  "Tyranids",
  "AdeptusMechanicus",
  "WorldEaters",
  "BloodAngels",
  "Genestealers",
  "Custodes",
  "EmperorsChildren",
  "LeaguesOfVotann",
  "AdeptusAstartes",
]

/** Position in `factionOrder`; unknown factions sort last, after every known one. */
export function factionRank(factionId: FactionId): number {
  const index = factionOrder.indexOf(factionId)
  return index === -1 ? factionOrder.length : index
}

export type FactionGroupMember = { id: CharacterId; name: string }
export type FactionGroup = {
  factionId: FactionId
  factionName: string
  members: FactionGroupMember[]
}

/**
 * Group characters by faction, ordered by the curated `factionOrder`. Members keep the order they
 * were passed in (the game catalog's own order), not an alphabetical one. `factionName` resolves
 * the localized heading for a faction id.
 */
export function groupByFaction(
  characters: { id: CharacterId; name: string; faction: FactionId }[],
  factionName: (factionId: FactionId) => string
): FactionGroup[] {
  const byFaction = new Map<FactionId, FactionGroupMember[]>()

  for (const character of characters) {
    let members = byFaction.get(character.faction)
    if (!members) {
      members = []
      byFaction.set(character.faction, members)
    }
    members.push({ id: character.id, name: character.name })
  }

  return [...byFaction.entries()]
    .map(([factionId, members]) => ({
      factionId,
      factionName: factionName(factionId),
      members,
    }))
    .sort((a, b) => factionRank(a.factionId) - factionRank(b.factionId))
}
