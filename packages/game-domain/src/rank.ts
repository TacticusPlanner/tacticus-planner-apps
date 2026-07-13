export const Rank = {
  Stone1: "Stone1",
  Stone2: "Stone2",
  Stone3: "Stone3",
  Iron1: "Iron1",
  Iron2: "Iron2",
  Iron3: "Iron3",
  Bronze1: "Bronze1",
  Bronze2: "Bronze2",
  Bronze3: "Bronze3",
  Silver1: "Silver1",
  Silver2: "Silver2",
  Silver3: "Silver3",
  Gold1: "Gold1",
  Gold2: "Gold2",
  Gold3: "Gold3",
  Diamond1: "Diamond1",
  Diamond2: "Diamond2",
  Diamond3: "Diamond3",
  Adamantine1: "Adamantine1",
  Adamantine2: "Adamantine2",
  // Adamantine3 is planned but removed from the ladder for now — nothing in-game can reach it yet
} as const

export type Rank = (typeof Rank)[keyof typeof Rank]

export const rankOrder: readonly Rank[] = Object.values(Rank)
export const firstRank: Rank = rankOrder[0]
export const lastRank: Rank = rankOrder[rankOrder.length - 1]

export const rankIndex = (id: Rank): number => rankOrder.indexOf(id)

export const isRank = (value: string): value is Rank =>
  (rankOrder as readonly string[]).includes(value)

export const isAdamantineRank = (rank: Rank): boolean =>
  rank.startsWith("Adamantine")

export const rankAt = (index: number): Rank =>
  rankOrder[Math.min(Math.max(index, 0), rankOrder.length - 1)]
