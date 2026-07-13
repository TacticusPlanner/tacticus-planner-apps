import { factionIdSchema, type FactionId, type UnitId } from "./game-ids"

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
].map((id) => factionIdSchema.parse(id))

export function factionRank(factionId: FactionId): number {
  const index = factionOrder.indexOf(factionId)
  return index === -1 ? factionOrder.length : index
}

export type FactionGroupMember = { id: UnitId; name: string }
export type FactionGroup = {
  factionId: FactionId
  factionName: string
  members: FactionGroupMember[]
}

export function groupByFaction(
  characters: { id: UnitId; name: string; faction: FactionId }[],
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
