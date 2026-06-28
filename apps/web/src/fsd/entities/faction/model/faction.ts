// Alliance display order (Imperial → Chaos → Xenos → Neutral); factions group under their alliance.
export const allianceOrder = ["Imperial", "Chaos", "Xenos", "Neutral"] as const

export const allianceRank = (alliance: string): number => {
  const index = (allianceOrder as readonly string[]).indexOf(alliance)
  return index === -1 ? allianceOrder.length : index
}
