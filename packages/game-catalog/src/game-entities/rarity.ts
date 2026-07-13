import { Rarity, type Rarity as RarityType } from "@workspace/game-domain"

const rarityTextClass: Record<RarityType, string> = {
  Common: "text-[var(--rarity-common)]",
  Uncommon: "text-[var(--rarity-uncommon)]",
  Rare: "text-[var(--rarity-rare)]",
  Epic: "text-[var(--rarity-epic)]",
  Legendary: "text-[var(--rarity-legendary)]",
  Mythic: "text-[var(--rarity-mythic)]",
}

export const rarityClass = (rarity: RarityType): string =>
  rarityTextClass[rarity] ?? rarityTextClass[Rarity.Common]
