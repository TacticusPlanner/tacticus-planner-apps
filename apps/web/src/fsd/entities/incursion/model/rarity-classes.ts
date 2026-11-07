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

/** Solid fill for a cleared tier; the faint one marks a tier still to clear. */
export const RARITY_FILL: Record<string, string> = {
  Common: "bg-(--rarity-common)",
  Uncommon: "bg-(--rarity-uncommon)",
  Rare: "bg-(--rarity-rare)",
  Epic: "bg-(--rarity-epic)",
  Legendary: "bg-(--rarity-legendary)",
  Mythic: "bg-(--rarity-mythic)",
}

export const RARITY_FILL_FAINT: Record<string, string> = {
  Common: "bg-(--rarity-common)/20",
  Uncommon: "bg-(--rarity-uncommon)/20",
  Rare: "bg-(--rarity-rare)/20",
  Epic: "bg-(--rarity-epic)/20",
  Legendary: "bg-(--rarity-legendary)/20",
  Mythic: "bg-(--rarity-mythic)/20",
}
