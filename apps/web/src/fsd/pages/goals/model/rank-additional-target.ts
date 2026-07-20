import { Rank, rankIndex, type Rank as RankType } from "@workspace/game-domain"

// Ported from V1's `rank-goal-select.tsx` / `rankToLevel` (tacticusplanner's `models/constants.ts`)
// — restricted to ranks that exist in this domain model's ladder (no `Locked`, no unreachable
// `Adamantine3`).
const rankToLevel: Record<RankType, number> = {
  Stone1: 1,
  Stone2: 3,
  Stone3: 5,
  Iron1: 8,
  Iron2: 11,
  Iron3: 14,
  Bronze1: 17,
  Bronze2: 20,
  Bronze3: 23,
  Silver1: 26,
  Silver2: 29,
  Silver3: 32,
  Gold1: 35,
  Gold2: 38,
  Gold3: 41,
  Diamond1: 44,
  Diamond2: 47,
  Diamond3: 50,
  Adamantine1: 55,
  Adamantine2: 60,
}

/** True from Diamond3 onward — V1's `isMythicUpgrade` threshold (`rank-goal-select.tsx`). A
 * character rank's 6 upgrade slots are 2 rows of 3 (1 Health + 1 Damage + 1 Armour per row): below
 * Diamond3 the top row is immediately appliable at the current rank, while the bottom row needs the
 * unit to have already advanced a further level — so only the top row's 1-3 slots are ever
 * independently targetable there. A Diamond3+ rank's 6 slots aren't row-paired that way; V1 numbers
 * them individually instead (see `additionalTargetOptions`). */
function isMythicRank(rank: RankType): boolean {
  return rankIndex(rank) >= rankIndex(Rank.Diamond3)
}

/** The XP-level label for a numbered partial-upgrade count at `rank` — ported from V1's
 * `mythicLevelLabel`. */
export function rowLevel(rank: RankType, count: number): number {
  return rankToLevel[rank] + count - 1
}

/**
 * The Rank goal's "Additional target" value — how far past a clean rank boundary the goal's target
 * actually reaches. `"None"` (the default for every rank) is a clean boundary. Below Diamond3:
 * `"TopRow1"`/`"TopRow2"` are 1 or 2 of the top row's 3 upgrades (Health, then + Damage); `"TopRow"`
 * is all 3 (+ Armour) — V1's "Rank Point Five". Diamond3+: no top row — instead the rank's own 6
 * upgrade slots are numbered individually as `"Row1"`-`"Row5"` (V1's "Mythic-tier" partial target),
 * each at its own XP level.
 */
export type RankAdditionalTarget =
  | "None"
  | "TopRow1"
  | "TopRow2"
  | "TopRow"
  | "Row1"
  | "Row2"
  | "Row3"
  | "Row4"
  | "Row5"

const rowTargets: readonly RankAdditionalTarget[] = [
  "Row1",
  "Row2",
  "Row3",
  "Row4",
  "Row5",
]

/** Every selectable "Additional target" for `rank`, recalculated whenever the target rank changes —
 * `"None"` always first, then either the top-row progression (`"TopRow1"`, `"TopRow2"`, `"TopRow"`,
 * below Diamond3) or the 5 numbered Row options (Diamond3+) — never both, see `isMythicRank`. */
export function additionalTargetOptions(
  rank: RankType
): readonly RankAdditionalTarget[] {
  return isMythicRank(rank)
    ? ["None", ...rowTargets]
    : ["None", "TopRow1", "TopRow2", "TopRow"]
}

/** The 1-5 count encoded by a `"RowN"` value, or `null` for every other value. */
export function rowCount(value: RankAdditionalTarget): number | null {
  const index = rowTargets.indexOf(value)
  return index === -1 ? null : index + 1
}

/**
 * Resolves an Additional target into the selection knobs both the backend submission and the
 * client-side resource preview need:
 * - `pointFive`/`appliedUpgrades` are the backend's `RankTarget` fields — it only ever checks their
 *   *count* (`Math.Max(appliedUpgrades, pointFive ? 3 : 0)` against the player's distinct applied
 *   slot count, `GoalAchievementEvaluator.RankAchieved`), so it doesn't matter that pre-Diamond3 and
 *   Diamond3+ reach the same numbers via different upgrade subsets.
 * - `topRowCount` is client-preview-only (`rankUpUpgradeIds`'s third mode) — needed to disambiguate
 *   what the *same* `appliedUpgrades` count actually selects: the first N of the top-row subset
 *   below Diamond3, vs. the first N of the raw 6 at Diamond3+.
 */
export function additionalTargetSelection(value: RankAdditionalTarget): {
  pointFive: boolean
  appliedUpgrades: number
  topRowCount: number
} {
  switch (value) {
    case "None":
      return { pointFive: false, appliedUpgrades: 0, topRowCount: 0 }
    case "TopRow1":
      return { pointFive: false, appliedUpgrades: 1, topRowCount: 1 }
    case "TopRow2":
      return { pointFive: false, appliedUpgrades: 2, topRowCount: 2 }
    case "TopRow":
      return { pointFive: true, appliedUpgrades: 0, topRowCount: 0 }
    default: {
      const count = rowCount(value) ?? 0
      return { pointFive: false, appliedUpgrades: count, topRowCount: 0 }
    }
  }
}

/** The character level required to reach `rank` with `additionalTarget` applied — ranking up (and
 * applying each upgrade slot beyond a clean rank boundary) requires having already reached a
 * specific level, per V1's `rankToLevel` table. Used to auto-suggest a Level goal alongside a Rank
 * goal (see use-goal-prerequisites.ts) whenever the target exceeds the character's current level. */
export function requiredLevelForRankTarget(
  rank: RankType,
  additionalTarget: RankAdditionalTarget
): number {
  switch (additionalTarget) {
    case "None":
      return rankToLevel[rank]
    case "TopRow1":
      return rowLevel(rank, 1)
    case "TopRow2":
      return rowLevel(rank, 2)
    case "TopRow":
      return rowLevel(rank, 3)
    default:
      return rowLevel(rank, rowCount(additionalTarget) ?? 1)
  }
}

/** The inverse of `additionalTargetSelection` — reconstructs the Additional target a persisted goal
 * (`GoalDetail.config.rank`) was created with, for read-only display (the edit flow never lets a
 * user change a goal's rank target, only re-derives this for the Farming Strategy availability
 * calc). Needs `rank` too — the wire pair alone can't tell a pre-Diamond3 `"TopRow2"` apart from a
 * Diamond3+ `"Row2"`, since both send `appliedUpgrades: 2`. */
export function additionalTargetFromWire(
  rank: RankType,
  wire: { endPointFive: boolean; endAppliedUpgrades: number }
): RankAdditionalTarget {
  if (isMythicRank(rank)) {
    return wire.endAppliedUpgrades > 0
      ? (rowTargets[wire.endAppliedUpgrades - 1] ?? "None")
      : "None"
  }
  if (wire.endPointFive || wire.endAppliedUpgrades >= 3) return "TopRow"
  if (wire.endAppliedUpgrades === 2) return "TopRow2"
  if (wire.endAppliedUpgrades === 1) return "TopRow1"
  return "None"
}
