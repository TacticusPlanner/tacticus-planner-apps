// Catalog rarity values, lowest → highest. Used for ordering and colour.
export const rarityOrder = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
] as const

export const rarityRank = (rarity: string): number => {
  const index = (rarityOrder as readonly string[]).indexOf(rarity)
  return index === -1 ? 0 : index
}

// Tailwind text-colour class per rarity (works in light/dark via the configured palette).
const rarityTextClass: Record<string, string> = {
  Common: "text-zinc-500 dark:text-zinc-400",
  Uncommon: "text-green-600 dark:text-green-400",
  Rare: "text-blue-600 dark:text-blue-400",
  Epic: "text-purple-600 dark:text-purple-400",
  Legendary: "text-amber-600 dark:text-amber-400",
  Mythic: "text-rose-600 dark:text-rose-400",
}

export const rarityClass = (rarity: string): string =>
  rarityTextClass[rarity] ?? rarityTextClass.Common
