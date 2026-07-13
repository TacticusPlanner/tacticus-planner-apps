export const Rarity = {
  Common: "Common",
  Uncommon: "Uncommon",
  Rare: "Rare",
  Epic: "Epic",
  Legendary: "Legendary",
  Mythic: "Mythic",
} as const

export type Rarity = (typeof Rarity)[keyof typeof Rarity]

export const rarityOrder: readonly Rarity[] = Object.values(Rarity)

export const rarityRank = (rarity: Rarity): number =>
  rarityOrder.indexOf(rarity)
