/** The item slot types (a catalog item's `type`, a character's `equipmentSlots[]` entry), in the
 *  order the pages list them: the two weapon-like slots, their boosters, then Defensive. */
export const ITEM_SLOT_TYPES = [
  "I_Crit",
  "I_Block",
  "I_Booster_Crit",
  "I_Booster_Block",
  "I_Defensive",
] as const

export type ItemSlotType = (typeof ITEM_SLOT_TYPES)[number]

export function isItemSlotType(value: string): value is ItemSlotType {
  return (ITEM_SLOT_TYPES as readonly string[]).includes(value)
}

/** A slot type's place in `ITEM_SLOT_TYPES`; an unknown type sorts last. */
export function itemSlotRank(type: string): number {
  const index = (ITEM_SLOT_TYPES as readonly string[]).indexOf(type)
  return index === -1 ? ITEM_SLOT_TYPES.length : index
}

/** The slot a booster needs filled first: the game won't equip a Crit Booster without a Crit item,
 *  or a Block Booster without a Block item. */
export function boosterBaseSlot(type: string): ItemSlotType | undefined {
  if (type === "I_Booster_Crit") return "I_Crit"
  if (type === "I_Booster_Block") return "I_Block"
  return undefined
}

/** A character's `equipmentSlots` position from a synced `slotId` ("Slot1" → 0); undefined when the
 *  id isn't one. */
export function slotIndexOf(slotId: string): number | undefined {
  const match = /^Slot(\d+)$/.exec(slotId)
  if (!match) return undefined
  const index = Number(match[1]) - 1
  return index >= 0 ? index : undefined
}
