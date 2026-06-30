export const Rarity = {
  Common: "Common",
  Uncommon: "Uncommon",
  Rare: "Rare",
  Epic: "Epic",
  Legendary: "Legendary",
  Mythic: "Mythic",
} as const

export type Rarity = (typeof Rarity)[keyof typeof Rarity]

export const rarityOrder: readonly Rarity[] = [
  Rarity.Common,
  Rarity.Uncommon,
  Rarity.Rare,
  Rarity.Epic,
  Rarity.Legendary,
  Rarity.Mythic,
]

export const rarityRank = (rarity: string): number => {
  const index = rarityOrder.indexOf(rarity as Rarity)
  return index === -1 ? 0 : index
}
