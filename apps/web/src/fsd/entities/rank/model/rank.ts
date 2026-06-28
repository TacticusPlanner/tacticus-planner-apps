// The fixed in-game rank progression. The catalog uses the space-free ids (e.g. "Stone1"); the human
// label ("Stone I") is resolved through the `ranks` i18n namespace. Upgrades exist for every rank except
// the final Adamantine3 (you cannot rank up beyond it).
export const rankOrder = [
  "Stone1",
  "Stone2",
  "Stone3",
  "Iron1",
  "Iron2",
  "Iron3",
  "Bronze1",
  "Bronze2",
  "Bronze3",
  "Silver1",
  "Silver2",
  "Silver3",
  "Gold1",
  "Gold2",
  "Gold3",
  "Diamond1",
  "Diamond2",
  "Diamond3",
  "Adamantine1",
  "Adamantine2",
  "Adamantine3",
] as const

export type RankId = (typeof rankOrder)[number]

export const firstRank: RankId = rankOrder[0]
export const lastRank: RankId = rankOrder[rankOrder.length - 1]

export const rankIndex = (id: RankId): number => rankOrder.indexOf(id)

export const isRankId = (value: string): value is RankId =>
  (rankOrder as readonly string[]).includes(value)

/** The rank `steps` positions after `id`, clamped to the valid range. */
export const rankAt = (index: number): RankId =>
  rankOrder[Math.min(Math.max(index, 0), rankOrder.length - 1)]
