import type { Rarity } from "@workspace/game-domain"
import { progressionIndex, rarityRank } from "@workspace/game-domain"

import {
  boosterBaseSlot,
  compareByRarityThenLevel,
  itemChanceAt,
  itemSlotRank,
} from "@/shared/equipment"
import { firstDifference } from "@/shared/lib"

import { openSlotCount } from "./owned-items"
import type {
  CatalogItem,
  OwnedCharacter,
  OwnedItems,
  WornItem,
} from "./owned-items"

/** One copy of an item at a level. */
export type ItemCopy = { itemId: string; level: number }

/** Why a suggestion is better than what the slot holds. */
export type SuggestionReason =
  | { kind: "empty" }
  | { kind: "rarity"; from: Rarity; to: Rarity }
  | { kind: "level"; from: number; to: number }
  | { kind: "chance"; from: number; to: number }

/** One slot to fill or improve with a spare copy. */
export type Suggestion = {
  slotIndex: number
  slotType: string
  /** The slot isn't open yet (the third slot below Rare 4 stars), or a booster's base slot isn't. */
  locked: boolean
  current?: ItemCopy
  next: ItemCopy
  reason: SuggestionReason
  /** How much the slot gains: empty slots and rarity steps count most, then levels. */
  gain: number
}

export type CharacterSuggestions = {
  characterId: string
  faction: string
  rarity: Rarity
  suggestions: Suggestion[]
}

/** A spare relic and the characters who could wear it. */
export type UnwornRelic<Item extends CatalogItem = CatalogItem> = {
  item: Item
  /** Highest level first, with how many copies at each. */
  copies: { level: number; spare: number }[]
  wearers: RelicWearer[]
}

type RelicWearer = {
  characterId: string
  /** ready: owned, Mythic and wearing no relic. needsMythic: owned below Mythic. hasRelic: owned and
   *  already wearing a relic (one per character). notOwned: not in the roster yet. */
  status: "ready" | "needsMythic" | "hasRelic" | "notOwned"
}

export type ItemSuggestions<Item extends CatalogItem = CatalogItem> = {
  characters: CharacterSuggestions[]
  relics: UnwornRelic<Item>[]
}

/** Spare copies left to hand out, per item and level. */
class SparePool {
  private readonly counts = new Map<string, Map<number, number>>()

  constructor(owned: OwnedItems) {
    for (const piece of owned.pieces) {
      if (piece.item.isRelic) continue
      const levels = new Map<number, number>()
      for (const entry of piece.levels)
        if (entry.spare > 0) levels.set(entry.level, entry.spare)
      if (levels.size > 0) this.counts.set(piece.item.id, levels)
    }
  }

  /** The copies on offer among `itemIds`: each item's highest level still spare. */
  offers(itemIds: ReadonlySet<string>): ItemCopy[] {
    const offers: ItemCopy[] = []
    for (const itemId of itemIds) {
      const levels = this.counts.get(itemId)
      if (!levels) continue
      const level = Math.max(...levels.keys())
      offers.push({ itemId, level })
    }
    return offers
  }

  take({ itemId, level }: ItemCopy) {
    const levels = this.counts.get(itemId)
    const left = (levels?.get(level) ?? 0) - 1
    if (!levels) return
    if (left > 0) levels.set(level, left)
    else levels.delete(level)
    if (levels.size === 0) this.counts.delete(itemId)
  }
}

const RARITY_GAIN = 100

/** Compares two copies the way Suggestions ranks them: higher rarity, then higher level, then
 *  higher crit or block chance. Negative when `a` is better. */
export function compareCopies(
  a: ItemCopy,
  b: ItemCopy,
  itemOf: (id: string) => CatalogItem | undefined
): number {
  const itemA = itemOf(a.itemId)
  const itemB = itemOf(b.itemId)
  if (!itemA || !itemB) return 0
  return firstDifference(
    compareByRarityThenLevel(
      { rarity: itemA.rarity, level: a.level },
      { rarity: itemB.rarity, level: b.level }
    ),
    itemChanceAt(itemB, b.level) - itemChanceAt(itemA, a.level)
  )
}

/** Why `next` beats `current`, or undefined when it doesn't. A Defensive item has no chance, so two
 *  Defensive items at the same rarity and level never swap. */
function improvement(
  next: ItemCopy,
  current: ItemCopy | undefined,
  itemOf: (id: string) => CatalogItem | undefined
): { reason: SuggestionReason; gain: number } | undefined {
  const nextItem = itemOf(next.itemId)
  if (!nextItem) return undefined
  if (!current) {
    return {
      reason: { kind: "empty" },
      gain: (rarityRank(nextItem.rarity) + 1) * RARITY_GAIN + next.level,
    }
  }
  const currentItem = itemOf(current.itemId)
  if (!currentItem) return undefined
  const rarityStep =
    rarityRank(nextItem.rarity) - rarityRank(currentItem.rarity)
  if (rarityStep !== 0) {
    return rarityStep > 0
      ? {
          reason: {
            kind: "rarity",
            from: currentItem.rarity,
            to: nextItem.rarity,
          },
          gain: rarityStep * RARITY_GAIN,
        }
      : undefined
  }
  if (next.level !== current.level) {
    return next.level > current.level
      ? {
          reason: { kind: "level", from: current.level, to: next.level },
          gain: next.level - current.level,
        }
      : undefined
  }
  const from = itemChanceAt(currentItem, current.level)
  const to = itemChanceAt(nextItem, next.level)
  return to > from
    ? { reason: { kind: "chance", from, to }, gain: (to - from) / 100 }
    : undefined
}

/** The slot positions in the order to fill them: base slots before their boosters. */
function slotOrder(character: OwnedCharacter): number[] {
  return character.slots
    .map((type, index) => ({ type, index }))
    .toSorted((a, b) => itemSlotRank(a.type) - itemSlotRank(b.type))
    .map(({ index }) => index)
}

type Planned = { suggestion?: Suggestion; worn?: WornItem; open: boolean }

/** What one character's slots hold and what has been planned for them so far. */
class CharacterPlan {
  readonly slots: Planned[]
  readonly character: OwnedCharacter
  private readonly itemOf: (id: string) => CatalogItem | undefined

  constructor(
    character: OwnedCharacter,
    itemOf: (id: string) => CatalogItem | undefined
  ) {
    this.character = character
    this.itemOf = itemOf
    const open = openSlotCount(character.progression, character.slots.length)
    this.slots = character.slots.map((_, index) => ({
      worn: character.worn.find((item) => item.slotIndex === index),
      open: index < open,
    }))
  }

  /** Whether a booster's base slot is filled (worn or planned), and whether only by a locked plan. */
  private base(type: string): { filled: boolean; locked: boolean } {
    const baseType = boosterBaseSlot(type)
    if (!baseType) return { filled: true, locked: false }
    const bases = this.character.slots
      .map((slotType, index) => ({ slotType, slot: this.slots[index] }))
      .filter(({ slotType }) => slotType === baseType)
    if (bases.some(({ slot }) => slot?.worn))
      return { filled: true, locked: false }
    const planned = bases.find(({ slot }) => slot?.suggestion)
    return planned?.slot?.suggestion
      ? { filled: true, locked: planned.slot.suggestion.locked }
      : { filled: false, locked: false }
  }

  /** Plans the best spare for each slot still unplanned; `lockedPass` allows slots not open yet. */
  fill(pool: SparePool, lockedPass: boolean) {
    for (const index of slotOrder(this.character))
      this.planSlot(pool, index, lockedPass)
  }

  private planSlot(pool: SparePool, index: number, lockedPass: boolean) {
    const slot = this.slots[index]
    const type = this.character.slots[index]
    if (!slot || type === undefined || slot.suggestion) return
    const current = slot.worn
    // A worn Mythic item can't be taken off, and relics stay where the player put them. An item
    // the catalog doesn't know can't be compared, so its slot is left alone.
    if (
      current &&
      (current.unknown || this.itemOf(current.itemId)?.rarity === "Mythic")
    )
      return
    const base = this.base(type)
    const locked = !slot.open || base.locked
    if (!base.filled || (locked && !lockedPass)) return
    const best = this.best(pool, index)
    const better = best ? improvement(best, current, this.itemOf) : undefined
    if (!best || !better) return
    pool.take(best)
    slot.suggestion = {
      slotIndex: index,
      slotType: type,
      locked,
      ...(current
        ? { current: { itemId: current.itemId, level: current.level } }
        : {}),
      next: best,
      ...better,
    }
  }

  /** The best spare the slot may take: eligible, not a relic, and at or below the character's
   *  rarity. */
  private best(pool: SparePool, index: number): ItemCopy | undefined {
    const eligible = this.character.eligible[index]
    if (!eligible) return undefined
    const characterRank = rarityRank(this.character.rarity)
    return pool
      .offers(eligible)
      .filter((copy) => {
        const item = this.itemOf(copy.itemId)
        return (
          item !== undefined &&
          !item.isRelic &&
          rarityRank(item.rarity) <= characterRank
        )
      })
      .toSorted((a, b) => compareCopies(a, b, this.itemOf))[0]
  }

  suggestions(): Suggestion[] {
    return this.slots
      .map((slot) => slot.suggestion)
      .filter(
        (suggestion): suggestion is Suggestion => suggestion !== undefined
      )
      .toSorted((a, b) => a.slotIndex - b.slotIndex)
  }
}

/** Every spare relic with the characters who could wear it, ready ones first. */
function unwornRelics<Item extends CatalogItem>(
  owned: OwnedItems<Item>,
  itemOf: (id: string) => CatalogItem | undefined
): UnwornRelic<Item>[] {
  const byId = new Map(owned.characters.map((c) => [c.id, c]))
  const statusRank: Record<RelicWearer["status"], number> = {
    ready: 0,
    needsMythic: 1,
    hasRelic: 2,
    notOwned: 3,
  }
  const wearsRelic = (character: OwnedCharacter) =>
    character.worn.some((worn) => itemOf(worn.itemId)?.isRelic === true)
  return owned.pieces
    .filter((piece) => piece.item.isRelic && piece.spare > 0)
    .map((piece) => ({
      item: piece.item,
      copies: piece.levels
        .filter((entry) => entry.spare > 0)
        .map(({ level, spare }) => ({ level, spare })),
      wearers: piece.item.allowedUnits
        .map((characterId): RelicWearer => {
          const character = byId.get(characterId)
          const status: RelicWearer["status"] = !character
            ? "notOwned"
            : character.rarity !== "Mythic"
              ? "needsMythic"
              : wearsRelic(character)
                ? "hasRelic"
                : "ready"
          return { characterId, status }
        })
        .toSorted((a, b) => statusRank[a.status] - statusRank[b.status]),
    }))
}

/**
 * What to equip with the spares already held. Each owned character's slots are filled or improved
 * with the best spare it may wear (higher rarity, then level, then crit or block chance), sharing
 * one pool of spares: the most progressed characters pick first, open slots before slots that open
 * later. A booster needs its base slot filled; a worn Mythic item stays; relics are never put in
 * a slot here and are listed apart with who could wear them.
 */
export function suggestItems<Item extends CatalogItem>(
  owned: OwnedItems<Item>,
  itemsById: ReadonlyMap<string, CatalogItem>
): ItemSuggestions<Item> {
  const itemOf = (id: string) => itemsById.get(id)
  const pool = new SparePool(owned)
  const plans = owned.characters
    .toSorted(
      (a, b) =>
        progressionIndex(b.progression) - progressionIndex(a.progression)
    )
    .map((character) => new CharacterPlan(character, itemOf))
  for (const plan of plans) plan.fill(pool, false)
  for (const plan of plans) plan.fill(pool, true)
  return {
    characters: plans
      .map((plan) => ({
        characterId: plan.character.id,
        faction: plan.character.faction,
        rarity: plan.character.rarity,
        suggestions: plan.suggestions(),
      }))
      .filter((entry) => entry.suggestions.length > 0),
    relics: unwornRelics(owned, itemOf),
  }
}

/** The copies Suggestions hands out, per item and level: Reclaim keeps them. */
export function suggestedCopies(
  suggestions: ItemSuggestions
): ReadonlyMap<string, ReadonlyMap<number, number>> {
  const copies = new Map<string, Map<number, number>>()
  for (const character of suggestions.characters) {
    for (const { next } of character.suggestions) {
      const levels = copies.get(next.itemId) ?? new Map<number, number>()
      levels.set(next.level, (levels.get(next.level) ?? 0) + 1)
      copies.set(next.itemId, levels)
    }
  }
  return copies
}
