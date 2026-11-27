import type { Rarity } from "@workspace/game-domain"
import { rarityRank } from "@workspace/game-domain"

import {
  NO_COST,
  addCosts,
  itemSlotRank,
  reclaimValue,
  scaleCost,
} from "@/shared/equipment"
import type { ItemCost } from "@/shared/equipment"
import { firstDifference } from "@/shared/lib"

import { eligibleBySlot } from "./owned-items"
import type {
  CatalogCharacter,
  CatalogItem,
  OwnedCharacter,
  OwnedItems,
} from "./owned-items"

/** Why a stack is or isn't safe to reclaim. */
export type ReclaimReason =
  /** Nobody could use it: every slot that may take it, owned or not, already holds this rarity or
   *  better. */
  | { kind: "covered"; rarity: Rarity }
  /** More spare copies than slots that could still use one: the extra copies are safe. */
  | { kind: "surplus"; held: number; users: number }
  /** No more spare copies than slots that could still use one. */
  | { kind: "needed"; held: number; users: number }
  /** Never suggested: relics and Mythic items. */
  | { kind: "relic" }
  | { kind: "mythic" }

/** One spare stack (an item at a level) and how many of its copies are safe to reclaim. */
export type ReclaimStack<Item extends CatalogItem = CatalogItem> = {
  item: Item
  level: number
  spare: number
  safe: number
  /** Copies Suggestions hands out, which are kept. */
  reserved: number
  reason: ReclaimReason
  /** What one copy returns. */
  value: ItemCost
}

type ReclaimTotal = { copies: number; value: ItemCost }

export type ReclaimPlan<Item extends CatalogItem = CatalogItem> = {
  /** By slot type, then highest rarity, then highest level. */
  stacks: ReclaimStack<Item>[]
  safe: ReclaimTotal
  all: ReclaimTotal
}

/** Every slot (character and position) that may take each item. */
type SlotIndex = ReadonlyMap<
  string,
  readonly { characterId: string; slotIndex: number }[]
>

function slotIndex(
  catalogCharacters: ReadonlyMap<string, CatalogCharacter>
): SlotIndex {
  const index = new Map<string, { characterId: string; slotIndex: number }[]>()
  for (const character of catalogCharacters.values()) {
    eligibleBySlot(character).forEach((itemIds, position) => {
      for (const itemId of itemIds) {
        const slots = index.get(itemId) ?? []
        slots.push({ characterId: character.id, slotIndex: position })
        index.set(itemId, slots)
      }
    })
  }
  return index
}

/**
 * How many slots could still use the item: every slot that may take it, on a character the player
 * owns or not, unless an owned character already wears an item of this rarity or better there (or
 * one the catalog doesn't know).
 * Slots that aren't open yet count, and so do characters not owned yet (row 10 B), so the count
 * leans towards keeping.
 */
function potentialUsers(
  item: CatalogItem,
  slots: SlotIndex,
  ownedById: ReadonlyMap<string, OwnedCharacter>,
  itemOf: (id: string) => CatalogItem | undefined
): number {
  const rank = rarityRank(item.rarity)
  return (slots.get(item.id) ?? []).filter(({ characterId, slotIndex }) => {
    const worn = ownedById
      .get(characterId)
      ?.worn.find((entry) => entry.slotIndex === slotIndex)
    if (!worn) return true
    // A slot holding an item the catalog doesn't know is filled and can't be compared.
    const wornItem = itemOf(worn.itemId)
    return wornItem !== undefined && rarityRank(wornItem.rarity) < rank
  }).length
}

type Level = { level: number; spare: number; reserved: number }

/** Splits an item's spare copies into kept and safe, keeping the highest levels first. */
function splitLevels(levels: readonly Level[], keep: number): number[] {
  let keepLeft = keep
  return levels.map(({ spare, reserved }) => {
    const free = Math.max(0, spare - reserved)
    const kept = Math.min(free, keepLeft)
    keepLeft -= kept
    return free - kept
  })
}

function reasonFor(
  item: CatalogItem,
  users: number,
  held: number
): ReclaimReason {
  if (item.isRelic) return { kind: "relic" }
  if (item.rarity === "Mythic") return { kind: "mythic" }
  if (users === 0) return { kind: "covered", rarity: item.rarity }
  return held > users
    ? { kind: "surplus", held, users }
    : { kind: "needed", held, users }
}

const sumTotal = (
  stacks: readonly ReclaimStack[],
  count: (s: ReclaimStack) => number
) =>
  stacks.reduce<ReclaimTotal>(
    (total, stack) => ({
      copies: total.copies + count(stack),
      value: addCosts(total.value, scaleCost(stack.value, count(stack))),
    }),
    { copies: 0, value: NO_COST }
  )

/** Slot type, highest rarity, `nameOf` (the displayed name), then highest level. */
export function compareStacks<Item extends CatalogItem>(
  nameOf: (item: Item) => string,
  locale: string
): (a: ReclaimStack<Item>, b: ReclaimStack<Item>) => number {
  return (a, b) =>
    firstDifference(
      itemSlotRank(a.item.type) - itemSlotRank(b.item.type),
      rarityRank(b.item.rarity) - rarityRank(a.item.rarity),
      nameOf(a.item).localeCompare(nameOf(b.item), locale),
      b.level - a.level
    )
}

/**
 * Which spare copies are safe to reclaim (row 10 B). A copy is safe when the player holds more spare
 * copies of the item than slots that could still use one (see `potentialUsers`), or when no slot
 * could. The highest-level copies are kept, and so are the copies Suggestions hands out. Relics and
 * Mythic items are never safe. Equipped items never appear: the game can't reclaim them.
 */
export function planReclaim<Item extends CatalogItem>({
  owned,
  catalogCharacters,
  itemsById,
  reserved,
}: {
  owned: OwnedItems<Item>
  catalogCharacters: ReadonlyMap<string, CatalogCharacter>
  itemsById: ReadonlyMap<string, CatalogItem>
  reserved: ReadonlyMap<string, ReadonlyMap<number, number>>
}): ReclaimPlan<Item> {
  const slots = slotIndex(catalogCharacters)
  const ownedById = new Map(owned.characters.map((c) => [c.id, c]))
  const itemOf = (id: string) => itemsById.get(id)
  const stacks: ReclaimStack<Item>[] = []

  for (const piece of owned.pieces) {
    const levels: Level[] = piece.levels
      .filter((entry) => entry.spare > 0)
      .map((entry) => ({
        level: entry.level,
        spare: entry.spare,
        reserved: Math.min(
          entry.spare,
          reserved.get(piece.item.id)?.get(entry.level) ?? 0
        ),
      }))
    if (levels.length === 0) continue
    const never = piece.item.isRelic || piece.item.rarity === "Mythic"
    // Each copy Suggestions hands out fills one of those slots, so it needs no free copy too.
    const totalReserved = levels.reduce((sum, l) => sum + l.reserved, 0)
    const users = never
      ? 0
      : Math.max(
          0,
          potentialUsers(piece.item, slots, ownedById, itemOf) - totalReserved
        )
    const held = levels.reduce((sum, l) => sum + l.spare - l.reserved, 0)
    const safe = never ? levels.map(() => 0) : splitLevels(levels, users)
    const reason = reasonFor(piece.item, users, held)
    levels.forEach((entry, index) => {
      stacks.push({
        item: piece.item,
        level: entry.level,
        spare: entry.spare,
        safe: safe[index] ?? 0,
        reserved: entry.reserved,
        reason,
        value: reclaimValue(piece.item, entry.level),
      })
    })
  }

  stacks.sort(compareStacks((item) => item.name, "en"))
  return {
    stacks,
    safe: sumTotal(stacks, (stack) => stack.safe),
    all: sumTotal(stacks, (stack) => stack.spare),
  }
}
