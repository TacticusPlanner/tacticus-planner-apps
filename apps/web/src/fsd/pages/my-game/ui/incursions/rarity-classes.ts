/** The design system's rarity colours (`--rarity-*` tokens), as literal classes Tailwind can see. */
export const RARITY_BORDER: Record<string, string> = {
  Common: "border-(--rarity-common)",
  Uncommon: "border-(--rarity-uncommon)",
  Rare: "border-(--rarity-rare)",
  Epic: "border-(--rarity-epic)",
  Legendary: "border-(--rarity-legendary)",
  Mythic: "border-(--rarity-mythic)",
}

export const RARITY_TEXT: Record<string, string> = {
  Common: "text-(--rarity-common)",
  Uncommon: "text-(--rarity-uncommon)",
  Rare: "text-(--rarity-rare)",
  Epic: "text-(--rarity-epic)",
  Legendary: "text-(--rarity-legendary)",
  Mythic: "text-(--rarity-mythic)",
}
