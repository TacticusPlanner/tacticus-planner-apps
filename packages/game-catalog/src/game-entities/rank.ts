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
  Adamantine3: "Adamantine3",
} as const

export type Rank = (typeof Rank)[keyof typeof Rank]
export type RankId = Rank

export const rankOrder: readonly RankId[] = [
  Rank.Stone1,
  Rank.Stone2,
  Rank.Stone3,
  Rank.Iron1,
  Rank.Iron2,
  Rank.Iron3,
  Rank.Bronze1,
  Rank.Bronze2,
  Rank.Bronze3,
  Rank.Silver1,
  Rank.Silver2,
  Rank.Silver3,
  Rank.Gold1,
  Rank.Gold2,
  Rank.Gold3,
  Rank.Diamond1,
  Rank.Diamond2,
  Rank.Diamond3,
  Rank.Adamantine1,
  Rank.Adamantine2,
  Rank.Adamantine3,
]

export const firstRank: RankId = rankOrder[0]
export const lastRank: RankId = rankOrder[rankOrder.length - 1]

export const rankIndex = (id: RankId): number => rankOrder.indexOf(id)

export const isRankId = (value: string): value is RankId =>
  (rankOrder as readonly string[]).includes(value)

export const rankAt = (index: number): RankId =>
  rankOrder[Math.min(Math.max(index, 0), rankOrder.length - 1)]
