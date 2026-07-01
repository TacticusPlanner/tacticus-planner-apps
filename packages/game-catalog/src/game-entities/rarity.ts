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

export const rarityRank = (rarity: Rarity): number =>
  rarityOrder.indexOf(rarity)

// Tailwind text-color classes keyed to CSS custom properties the consuming app defines
// (--rarity-common, --rarity-uncommon, …), the same pattern `icons.ts`'s asset-path helpers use.
const rarityTextClass: Record<Rarity, string> = {
  Common: "text-[var(--rarity-common)]",
  Uncommon: "text-[var(--rarity-uncommon)]",
  Rare: "text-[var(--rarity-rare)]",
  Epic: "text-[var(--rarity-epic)]",
  Legendary: "text-[var(--rarity-legendary)]",
  Mythic: "text-[var(--rarity-mythic)]",
}

export const rarityClass = (rarity: Rarity): string =>
  rarityTextClass[rarity] ?? rarityTextClass.Common
