import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

/** The three grand alliances, in the game's order, as the goals' needs key them. */
const ALLIANCES = ["Imperial", "Xenos", "Chaos"] as const
export type Alliance = (typeof ALLIANCES)[number]

type ItemNeed = { need: number; short: number }
type RarityAmount = { rarity: Rarity; amount: number }
type ByAlliance<T> = Record<Lowercase<Alliance>, T>

/** One resource on the Ascension tab: what is held, what the goals need and what is still short. */
export interface AscensionCount {
  have: number
  need: number
  short: number
}

const count = (have: number, need: ItemNeed | undefined): AscensionCount => ({
  have,
  need: need?.need ?? 0,
  short: need?.short ?? 0,
})

/** Held amounts by rarity (several entries for one rarity add up). */
function byRarity(amounts: readonly RarityAmount[]): Map<Rarity, number> {
  const held = new Map<Rarity, number>()
  for (const entry of amounts) {
    held.set(entry.rarity, (held.get(entry.rarity) ?? 0) + entry.amount)
  }
  return held
}

/** One rarity row of counts (forge badges; one alliance's badges or orbs), Common first. */
export function rarityCounts(
  amounts: readonly RarityAmount[],
  needs: Partial<Record<Rarity, ItemNeed>> | undefined,
  rarities: readonly Rarity[] = rarityOrder
): { rarity: Rarity; count: AscensionCount }[] {
  const held = byRarity(amounts)
  return rarities.map((rarity) => ({
    rarity,
    count: count(held.get(rarity) ?? 0, needs?.[rarity]),
  }))
}

/** Ability badges or orbs: a row per alliance, each with its counts per rarity. */
export function allianceRarityCounts(
  amounts: ByAlliance<readonly RarityAmount[]>,
  needs: Partial<Record<string, Partial<Record<Rarity, ItemNeed>>>>,
  rarities: readonly Rarity[] = rarityOrder
): { alliance: Alliance; cells: ReturnType<typeof rarityCounts> }[] {
  return ALLIANCES.map((alliance) => ({
    alliance,
    cells: rarityCounts(
      amounts[alliance.toLowerCase() as Lowercase<Alliance>],
      needs[alliance],
      rarities
    ),
  }))
}

/** The game has no Common ascension orb: orbs start at Uncommon. */
export const ORB_RARITIES: readonly Rarity[] = rarityOrder.filter(
  (rarity) => rarity !== "Common"
)

/** Machine of War components per alliance. */
export function componentCounts(
  components: ByAlliance<{ amount: number }>,
  needs: Partial<Record<string, ItemNeed>>
): { alliance: Alliance; count: AscensionCount }[] {
  return ALLIANCES.map((alliance) => ({
    alliance,
    count: count(
      components[alliance.toLowerCase() as Lowercase<Alliance>].amount,
      needs[alliance]
    ),
  }))
}

/** The XP books held, the XP they add up to and the goals' XP need, with what is short as books of
 *  the planning settings' rarity (the one the plan farms XP in). */
export interface XpBooksView {
  books: { rarity: Rarity; have: number }[]
  totalXp: number
  xp: AscensionCount
  /** Books of `bookRarity` that cover the short XP, rounded up. */
  booksShort: number
  bookRarity: Rarity
}

export function xpBooksView(params: {
  inventory: readonly { xpBookId: string; amount: number }[]
  books: Readonly<Record<Rarity, { id: string; xp: number }>>
  xpNeed: ItemNeed
  bookRarity: Rarity
}): XpBooksView {
  const held = new Map<string, number>()
  for (const entry of params.inventory) {
    held.set(entry.xpBookId, (held.get(entry.xpBookId) ?? 0) + entry.amount)
  }
  const books = rarityOrder.map((rarity) => ({
    rarity,
    have: held.get(params.books[rarity].id) ?? 0,
  }))
  const totalXp = books.reduce(
    (sum, book) => sum + book.have * params.books[book.rarity].xp,
    0
  )
  const bookXp = params.books[params.bookRarity].xp
  return {
    books,
    totalXp,
    xp: count(totalXp, params.xpNeed),
    booksShort: bookXp > 0 ? Math.ceil(params.xpNeed.short / bookXp) : 0,
    bookRarity: params.bookRarity,
  }
}
