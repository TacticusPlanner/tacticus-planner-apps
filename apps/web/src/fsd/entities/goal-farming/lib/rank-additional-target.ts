import {
  firstRank,
  lastRank,
  Rank,
  rankIndex,
  rankOrder,
} from "@workspace/game-domain"
import type { Rank as RankType } from "@workspace/game-domain"

import type { LevelRules } from "./level-rules"

/** A rank's 6 upgrade slot indices (column-major over the 2x3 grid) in book-reading order — top row
 * left to right, then bottom row — the order the game gates them by level, and so the order a numbered
 * `"RowN"` target applies them in. A character rank's 6 slots are 2 rows of 3 (1 Health + 1 Damage +
 * 1 Armour per row). Below Diamond3 the top row is appliable at the rank's own level and each
 * bottom-row slot needs one further level (Diamond2: 47, 47, 47, then 48, 49, 50); from Diamond3 on
 * every slot after the first needs its own further level. Either way each of 1-5 of 6 is a distinct
 * stopping point. */
export const BOOK_ORDER_SLOT_INDICES: readonly number[] = [0, 2, 4, 1, 3, 5]

/** The XP level needed to apply the first `count` (1-6) of `rank`'s upgrade slots in book-reading
 * order — the slots a numbered `"RowN"` target applies — read from the game's per-slot requirements
 * (V1's `mythicLevelLabel`). Diamond2: 47 for 1-3, then 48, 49. */
export function rowLevel(
  rank: RankType,
  count: number,
  rules: LevelRules
): number {
  const levels = rules.slotLevels[rank]
  const slots = BOOK_ORDER_SLOT_INDICES.slice(
    0,
    Math.min(Math.max(count, 1), 6)
  )
  return Math.max(0, ...slots.map((slot) => levels[slot] ?? 0))
}

/**
 * The Rank goal's "Additional target" value — how far past a clean rank boundary the goal's target
 * actually reaches. `"None"` (the default for every rank) is a clean boundary. `"Row1"`-`"Row5"` are
 * the first 1-5 of the rank's own 6 upgrade slots in book-reading order (V1's "N of 6" partial
 * target), each at its own XP level: `"Row3"` is the whole top row (V1's "Rank Point Five").
 */
export type RankAdditionalTarget =
  "None" | "Row1" | "Row2" | "Row3" | "Row4" | "Row5"

const rowTargets: readonly RankAdditionalTarget[] = [
  "Row1",
  "Row2",
  "Row3",
  "Row4",
  "Row5",
]

/** Every selectable "Additional target" for `rank`: clean plus 1/6-5/6 up to (not including) the
 * current maximum rank, and clean only at the maximum rank. */
export function additionalTargetOptions(
  rank: RankType
): readonly RankAdditionalTarget[] {
  return rank === lastRank ? ["None"] : ["None", ...rowTargets]
}

/** The 1-5 count encoded by a `"RowN"` value, or `null` for every other value. */
export function rowCount(value: RankAdditionalTarget): number | null {
  const index = rowTargets.indexOf(value)
  return index === -1 ? null : index + 1
}

/**
 * Resolves an Additional target into the backend's `RankTarget` end fields, which the client-side
 * resource preview reads too. The backend only ever checks their *count*
 * (`Math.Max(appliedUpgrades, pointFive ? 3 : 0)` against the player's distinct applied slot count).
 * New targets always send the count as `appliedUpgrades`; point-five survives only on goals saved
 * before every rank offered numbered targets (see `additionalTargetFromWire`).
 */
export function additionalTargetSelection(value: RankAdditionalTarget): {
  pointFive: boolean
  appliedUpgrades: number
} {
  return { pointFive: false, appliedUpgrades: rowCount(value) ?? 0 }
}

/** The character level required to reach `rank` with `additionalTarget` applied — ranking up (and
 * applying each upgrade slot beyond a clean rank boundary) requires having already reached a
 * specific level (`LevelRules.rankToLevel`). Shown as the level requirement of a Rank
 * goal (see `requiredLevelForGoal`) whenever the target exceeds the character's current level. */
export function requiredLevelForRankTarget(
  rank: RankType,
  additionalTarget: RankAdditionalTarget,
  rules: LevelRules
): number {
  const count = rowCount(additionalTarget)
  return count === null ? rules.rankToLevel[rank] : rowLevel(rank, count, rules)
}

/** How many of `rank`'s 6 upgrade slots are appliable at `level`. `rankToLevel`'s own gap to the
 *  next rank already encodes the split the game makes between slots granted immediately on rank-up
 *  and slots individually gated by one further level each — e.g. Diamond1 (level 44) to Diamond2
 *  (level 47) is a 3-level gap, meaning 3 of Diamond1's 6 slots (its "top row") come free at level
 *  44, and the other 3 (its "bottom row") need levels 45/46/47 one at a time, with the 47th actually
 *  ranking up rather than completing a same-rank 6th slot. The Stone tier's shorter 2-level gaps
 *  fall out of the same formula (4 free, 2 gated) without special-casing. The ladder's last rank has
 *  no next-rank gap to derive from, so every slot there is treated as individually gated (mirrors
 *  the already-numbered-per-slot Adamantine model `rowLevel`/`RowN` targets use). */
function appliableSlotsAtLevel(
  rank: RankType,
  level: number,
  rules: LevelRules
): number {
  const base = rules.rankToLevel[rank]
  if (level < base) return 0
  const nextRank = rankOrder[rankIndex(rank) + 1]
  const gatedSlots = nextRank ? rules.rankToLevel[nextRank] - base : 6
  const freeSlots = Math.max(0, 6 - gatedSlots)
  return Math.min(6, freeSlots + (level - base))
}

/** The highest (rank, applied-slots-within-that-rank) a character can reach *right now*, given
 *  `level` and the rarity ceiling `rarityMaxRank` (`maxRankForProgression`) — both independently cap
 *  a Rank goal's progress, whichever is lower currently binds. Slot-level granularity (not just
 *  whole ranks) matters here: a character's real applied-slot count can sit at, say, Diamond1 4/6,
 *  and a reachable-ceiling marker computed only at whole-rank precision could land *behind* that
 *  real progress (rarity alone permitting only Diamond1, with no notion of "how many of its slots"),
 *  which is never a valid state — level+materials-gated real progress can't outpace what level alone
 *  permits. Used to mark a Rank goal's progress bar with what's actually reachable right now. */
export function reachableRankProgress(
  level: number,
  rarityMaxRank: RankType,
  rules: LevelRules
): { rank: RankType; appliedSlots: number } {
  const rarityMaxIndex = rankIndex(rarityMaxRank)
  let rank: RankType = firstRank
  let appliedSlots = 0
  for (let index = 0; index <= rarityMaxIndex; index++) {
    const candidate = rankOrder[index]
    if (candidate === undefined) break
    if (level < rules.rankToLevel[candidate]) break
    rank = candidate
    appliedSlots = appliableSlotsAtLevel(candidate, level, rules)
  }
  return { rank, appliedSlots }
}

/** The inverse of `additionalTargetSelection` — reconstructs the Additional target a persisted goal
 * (`GoalDetail.config.rank`) was created with. Needs `rank` because a point-five goal (saved before
 * every rank offered numbered targets) is the whole top row, the same three slots as `"Row3"`, below
 * Adamantine1 and carries no meaning from there on. */
export function additionalTargetFromWire(
  rank: RankType,
  wire: { endPointFive: boolean; endAppliedUpgrades: number }
): RankAdditionalTarget {
  const count = Math.max(
    wire.endAppliedUpgrades,
    wire.endPointFive && rankIndex(rank) < rankIndex(Rank.Adamantine1) ? 3 : 0
  )
  return count > 0 ? (rowTargets[count - 1] ?? "None") : "None"
}

/** The end rank's slot indices an Additional target applies — the same slots `rankUpSlotOccurrences`
 * charges for it: the first N slots in book-reading order, and none for a clean rank boundary. */
export function additionalTargetSlots(
  value: RankAdditionalTarget
): readonly number[] {
  return BOOK_ORDER_SLOT_INDICES.slice(0, rowCount(value) ?? 0)
}

/** True when a character at `current.rank` with `current.appliedSlots` of that rank applied already
 * holds `end` with `additional` — so a same-rank target (e.g. Diamond3 to Diamond3 + top row) is
 * reached only once every slot it names is applied. */
export function rankTargetReached(
  current: { rank: RankType; appliedSlots: readonly number[] },
  end: RankType,
  additional: RankAdditionalTarget
): boolean {
  const difference = rankIndex(end) - rankIndex(current.rank)
  if (difference !== 0) return difference < 0
  return additionalTargetSlots(additional).every((slot) =>
    current.appliedSlots.includes(slot)
  )
}
