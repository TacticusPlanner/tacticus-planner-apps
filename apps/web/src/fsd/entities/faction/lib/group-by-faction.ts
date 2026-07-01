import { allianceRank, type Alliance } from "../model/faction"

export type FactionGroupMember = { id: string; name: string }
export type FactionGroup = {
  factionId: string
  factionName: string
  members: FactionGroupMember[]
}

/**
 * Group characters by faction, ordered by alliance (Imperial → Chaos → Xenos → Neutral) then by localized
 * faction name; members are sorted by their localized name. `factionName` resolves the localized heading.
 */
export function groupByFaction(
  characters: {
    id: string
    name: string
    faction: string
    alliance: Alliance
  }[],
  factionName: (factionId: string) => string
): FactionGroup[] {
  const byFaction = new Map<
    string,
    { alliance: Alliance; members: FactionGroupMember[] }
  >()

  for (const character of characters) {
    let group = byFaction.get(character.faction)
    if (!group) {
      group = { alliance: character.alliance, members: [] }
      byFaction.set(character.faction, group)
    }
    group.members.push({ id: character.id, name: character.name })
  }

  return [...byFaction.entries()]
    .map(([factionId, group]) => ({
      factionId,
      factionName: factionName(factionId),
      alliance: group.alliance,
      members: [...group.members].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort(
      (a, b) =>
        allianceRank(a.alliance) - allianceRank(b.alliance) ||
        a.factionName.localeCompare(b.factionName)
    )
    .map(({ factionId, factionName: name, members }) => ({
      factionId,
      factionName: name,
      members,
    }))
}
