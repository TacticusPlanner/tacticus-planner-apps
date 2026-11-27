import type { Progression, Rarity } from "@workspace/game-domain"
import {
  progressionIndex,
  progressionRarity,
  rarityRank,
} from "@workspace/game-domain"

import { itemSlotRank, slotIndexOf } from "@/shared/equipment"
import type { LadderItem } from "@/shared/equipment"
import { firstDifference } from "@/shared/lib"

/** What the Items pages read of a catalog equipment record. */
export type CatalogItem = LadderItem & {
  id: string
  name: string
  type: string
  isRelic: boolean
  isUniqueRelic: boolean
  allowedUnits: readonly string[]
  allowedFactions: readonly string[]
}

/** What the Items pages read of a catalog character. */
export type CatalogCharacter = {
  id: string
  faction: string
  equipmentSlots: readonly string[]
  eligibleEquipment: readonly {
    slot: string
    equipmentIds: readonly string[]
  }[]
}

/** What the Items pages read of a synced character. */
export type SyncedCharacter = {
  unitId: string
  progressionIndex: Progression
  equippedItems: readonly {
    slotId: string
    equipmentId: string
    level: number
  }[]
}

/** One synced inventory stack: `amount` spare copies of an item at a level. */
export type SyncedItemStack = { itemId: string; level: number; amount: number }

/** One item a character wears, in a slot of its `equipmentSlots`. `unknown` marks an item the
 *  catalog doesn't know: the slot is taken, but nothing can be compared with it. */
export type WornItem = {
  slotIndex: number
  itemId: string
  level: number
  unknown?: true
}

/** An owned character as the Items pages see it. */
export type OwnedCharacter = {
  id: string
  faction: string
  progression: Progression
  rarity: Rarity
  /** The character's slot types by position ("Slot1" is index 0). */
  slots: readonly string[]
  /** The item ids each slot may take (the catalog's eligible lists, by position). */
  eligible: readonly ReadonlySet<string>[]
  worn: readonly WornItem[]
}

/** The copies of one item at one level: spares in the inventory, and who wears one. */
type OwnedLevel = { level: number; spare: number; wearers: string[] }

/** One item the player holds or a character wears. */
export type OwnedPiece<Item extends CatalogItem = CatalogItem> = {
  item: Item
  /** Highest level first. */
  levels: OwnedLevel[]
  spare: number
  worn: number
}

export type OwnedItems<Item extends CatalogItem = CatalogItem> = {
  pieces: OwnedPiece<Item>[]
  characters: OwnedCharacter[]
  /** Copies whose id the catalog doesn't know (an item since retired or not yet released). */
  unknownCopies: number
}

/** The step that unlocks a character's third item slot (the game's
 *  `trinketUnlockProgressionRequirement`, 6 = Rare 4 stars); below it only two slots are open. */
const THIRD_SLOT_PROGRESSION: Progression = "Rare:FourStars"

/** How many of a character's item slots are open at its progression (the Collection rule). */
export function openSlotCount(
  progression: Progression,
  slotCount: number
): number {
  return progressionIndex(progression) >=
    progressionIndex(THIRD_SLOT_PROGRESSION)
    ? slotCount
    : Math.min(slotCount, 2)
}

/** A catalog character's eligible item ids by slot position (the catalog lists one entry per slot,
 *  in `equipmentSlots` order). */
export function eligibleBySlot(
  character: CatalogCharacter
): ReadonlySet<string>[] {
  return character.equipmentSlots.map(
    (_, index) =>
      new Set(character.eligibleEquipment[index]?.equipmentIds ?? [])
  )
}

/** Spare and worn copies per item and level, filled in by `buildOwnedItems`. */
class LevelTally {
  readonly byItem = new Map<string, Map<number, OwnedLevel>>()

  at(itemId: string, level: number): OwnedLevel {
    let levels = this.byItem.get(itemId)
    if (!levels) {
      levels = new Map()
      this.byItem.set(itemId, levels)
    }
    let entry = levels.get(level)
    if (!entry) {
      entry = { level, spare: 0, wearers: [] }
      levels.set(level, entry)
    }
    return entry
  }
}

/** One owned character, its worn items tallied; undefined when the catalog doesn't know it. */
function ownCharacter(
  synced: SyncedCharacter,
  catalog: CatalogCharacter | undefined,
  knows: (itemId: string) => boolean,
  tally: LevelTally
): { character?: OwnedCharacter; unknownCopies: number } {
  const worn: WornItem[] = []
  let unknownCopies = 0
  for (const equipped of synced.equippedItems) {
    const known = knows(equipped.equipmentId)
    if (known)
      tally.at(equipped.equipmentId, equipped.level).wearers.push(synced.unitId)
    else unknownCopies += 1
    // An unknown item still fills its slot, so nothing is suggested or kept for it.
    const slotIndex = slotIndexOf(equipped.slotId)
    if (slotIndex !== undefined) {
      worn.push({
        slotIndex,
        itemId: equipped.equipmentId,
        level: equipped.level,
        ...(known ? {} : { unknown: true as const }),
      })
    }
  }
  if (!catalog) return { unknownCopies }
  return {
    unknownCopies,
    character: {
      id: synced.unitId,
      faction: catalog.faction,
      progression: synced.progressionIndex,
      rarity: progressionRarity(synced.progressionIndex),
      slots: catalog.equipmentSlots,
      eligible: eligibleBySlot(catalog),
      worn,
    },
  }
}

/** Slot type, then highest rarity, then `nameOf` (the displayed name): the order the Pieces tab
 *  lists items in. */
export function comparePieces<Item extends CatalogItem>(
  nameOf: (item: Item) => string,
  locale: string
): (a: OwnedPiece<Item>, b: OwnedPiece<Item>) => number {
  return (a, b) =>
    firstDifference(
      itemSlotRank(a.item.type) - itemSlotRank(b.item.type),
      rarityRank(b.item.rarity) - rarityRank(a.item.rarity),
      nameOf(a.item).localeCompare(nameOf(b.item), locale)
    )
}

/**
 * Joins the synced inventory stacks with every owned character's worn items into one entry per item:
 * spare copies and wearers per level (highest level first), sorted by slot type, then rarity and the
 * catalog name (the tabs sort again by the displayed name).
 * Ids the catalog doesn't know are only counted.
 */
export function buildOwnedItems<Item extends CatalogItem>({
  catalogItems,
  catalogCharacters,
  syncedCharacters,
  inventory,
}: {
  catalogItems: ReadonlyMap<string, Item>
  catalogCharacters: ReadonlyMap<string, CatalogCharacter>
  syncedCharacters: readonly SyncedCharacter[]
  inventory: readonly SyncedItemStack[]
}): OwnedItems<Item> {
  const tally = new LevelTally()
  const knows = (itemId: string) => catalogItems.has(itemId)
  let unknownCopies = 0

  for (const stack of inventory) {
    if (stack.amount <= 0) continue
    if (knows(stack.itemId))
      tally.at(stack.itemId, stack.level).spare += stack.amount
    else unknownCopies += stack.amount
  }

  const characters: OwnedCharacter[] = []
  for (const synced of syncedCharacters) {
    const owned = ownCharacter(
      synced,
      catalogCharacters.get(synced.unitId),
      knows,
      tally
    )
    unknownCopies += owned.unknownCopies
    if (owned.character) characters.push(owned.character)
  }

  const pieces: OwnedPiece<Item>[] = []
  for (const [itemId, levels] of tally.byItem) {
    const item = catalogItems.get(itemId)
    if (!item) continue
    const ordered = [...levels.values()].toSorted((a, b) => b.level - a.level)
    pieces.push({
      item,
      levels: ordered,
      spare: ordered.reduce((sum, entry) => sum + entry.spare, 0),
      worn: ordered.reduce((sum, entry) => sum + entry.wearers.length, 0),
    })
  }
  pieces.sort(comparePieces((item) => item.name, "en"))
  return { pieces, characters, unknownCopies }
}
