import type { Rarity } from "@workspace/game-domain"

/** The points rules of a quest battle (design D3): three constants, so a game change is one edit. */
const MEDAL_POINTS = 100
export const MAX_MEDALS = 3
export const MAX_LIGHTNING_POINTS = 100

/** The player's best attempt at one battle, as entered. */
export type QuestBattleEntry = {
  /** 0 to 3; 0 means not won. */
  medals: number
  /** Lightning Victory points, 0 to 100 (the game awards 1 to 100 by HP left). */
  lightning: number
  /** One tick per served objective, in served order. */
  objectives: boolean[]
}

export const EMPTY_BATTLE_ENTRY: QuestBattleEntry = {
  medals: 0,
  lightning: 0,
  objectives: [],
}

/** What scoring reads of a served battle. */
export type ScoredBattle = {
  number: number
  tier: Rarity
  objectives: readonly { score: number }[]
}

type BattleScore = {
  number: number
  points: number
  max: number
  left: number
}

export type QuestScore = {
  battles: BattleScore[]
  /** Points and maximum per tier, in the battles' order of first appearance. */
  tiers: { tier: Rarity; points: number; max: number }[]
  total: number
  max: number
  /** Crates whose `points` the total reaches. */
  cratesOpened: number
  /** The next crate to open, or null when all are open (or there are no crates). */
  nextCrate: { number: number; points: number; pointsLeft: number } | null
  /** Battles below their maximum, most points left first, then by number. */
  pointsLeft: BattleScore[]
}

/** A battle's maximum: three medals, full Lightning Victory and every objective. */
export function battleMax(battle: ScoredBattle): number {
  return (
    MAX_MEDALS * MEDAL_POINTS +
    MAX_LIGHTNING_POINTS +
    battle.objectives.reduce((sum, objective) => sum + objective.score, 0)
  )
}

/** A battle's points: 0 when not won, else medals, Lightning Victory and ticked objective scores. */
function battlePoints(
  battle: ScoredBattle,
  entry: QuestBattleEntry | undefined
): number {
  if (!entry || entry.medals <= 0) return 0
  return (
    Math.min(entry.medals, MAX_MEDALS) * MEDAL_POINTS +
    Math.min(Math.max(entry.lightning, 0), MAX_LIGHTNING_POINTS) +
    battle.objectives.reduce(
      (sum, objective, index) =>
        sum + (entry.objectives[index] ? objective.score : 0),
      0
    )
  )
}

/**
 * The quest's score from the entered attempts (design D3): per battle, per tier, the total against the
 * maximum, the crates it opens and the next one, and where points are left. Every view reads this one
 * result, so the rows, headings and summary cannot disagree.
 */
export function scoreQuest(
  battles: readonly ScoredBattle[],
  entries: Readonly<Record<number, QuestBattleEntry | undefined>>,
  crates: readonly { number: number; points: number }[]
): QuestScore {
  const scores = battles.map((battle): BattleScore => {
    const max = battleMax(battle)
    const points = battlePoints(battle, entries[battle.number])
    return { number: battle.number, points, max, left: max - points }
  })
  const tiers: QuestScore["tiers"] = []
  battles.forEach((battle, index) => {
    const score = scores[index]!
    const tier = tiers.find((entry) => entry.tier === battle.tier)
    if (tier) {
      tier.points += score.points
      tier.max += score.max
    } else {
      tiers.push({ tier: battle.tier, points: score.points, max: score.max })
    }
  })
  const total = scores.reduce((sum, score) => sum + score.points, 0)
  const ordered = [...crates].sort((a, b) => a.points - b.points)
  const next = ordered.find((crate) => crate.points > total)
  return {
    battles: scores,
    tiers,
    total,
    max: scores.reduce((sum, score) => sum + score.max, 0),
    cratesOpened: ordered.filter((crate) => crate.points <= total).length,
    nextCrate: next
      ? {
          number: next.number,
          points: next.points,
          pointsLeft: next.points - total,
        }
      : null,
    pointsLeft: scores
      .filter((score) => score.left > 0)
      .sort((a, b) => b.left - a.left || a.number - b.number),
  }
}
