import {
  hseRestrictionPasses,
  type GameCatalogHseTier,
  type GameCatalogHseTracker,
} from "@workspace/game-catalog"

import { HSE_TOKEN_MODES, type HseTokenMode } from "./hse-token-supply"

/** What one scoring unit is: a kill, a cleared wave, or a battle (one per token). */
type HseScoringUnit = "kills" | "waves" | "battles"

/** Tracker kinds that score inside a token mode, by the unit they count (design D4). Guild and
 * expedition trackers never score in a token mode. */
const UNIT_BY_TRACKER_KIND: Readonly<Record<string, HseScoringUnit>> = {
  KillUnits: "kills",
  DefeatWaves: "waves",
  DeployedUnitsOfFactionMajority: "battles",
  FullLineUpOfFaction: "battles",
}

/** Default kills per token (Severyn's estimates; editable and persisted, design D5). */
const HSE_DEFAULT_KILLS_PER_TOKEN: Readonly<Record<HseTokenMode, number>> = {
  Arena: 5,
  Onslaught: 20,
  SalvageRun: 12,
}

export type HseModeScoring = {
  mode: HseTokenMode
  unit: HseScoringUnit
  /** The points of every tracker of that unit whose game modes pass the mode, summed. */
  pointsPerUnit: number
  /** How many trackers were summed (more than one: the UI states the "matches all" assumption). */
  trackerCount: number
}

/**
 * How each token mode scores for these trackers, in token-mode order; a mode no tracker scores in is
 * left out. A mode's unit is its first scoring tracker's; trackers of another unit in the same mode
 * (none in the served data) are not summed into it.
 */
export function hseModeScoring(
  trackers: readonly GameCatalogHseTracker[]
): HseModeScoring[] {
  return HSE_TOKEN_MODES.flatMap((mode) => {
    const scoring = trackers.filter(
      (tracker) =>
        UNIT_BY_TRACKER_KIND[tracker.kind] !== undefined &&
        hseRestrictionPasses(tracker.gameModes, mode)
    )
    const unit = scoring[0] ? UNIT_BY_TRACKER_KIND[scoring[0].kind] : undefined
    if (!unit) return []
    const sameUnit = scoring.filter(
      (tracker) => UNIT_BY_TRACKER_KIND[tracker.kind] === unit
    )
    return [
      {
        mode,
        unit,
        pointsPerUnit: sameUnit.reduce(
          (sum, tracker) => sum + tracker.points,
          0
        ),
        trackerCount: sameUnit.length,
      },
    ]
  })
}

/** The average a mode starts with: the kill estimate, 1 for battles (fixed), none for waves. */
function hseDefaultAverage(
  mode: HseTokenMode,
  unit: HseScoringUnit
): number | null {
  if (unit === "battles") return 1
  return unit === "kills" ? HSE_DEFAULT_KILLS_PER_TOKEN[mode] : null
}

export type HseProjectionInput = {
  tier: Pick<GameCatalogHseTier, "milestones" | "repeat">
  trackers: readonly GameCatalogHseTracker[]
  /** Tokens per mode until the event ends; null when the mode is not unlocked. */
  tokens: Readonly<Record<HseTokenMode, number | null>>
  /** The player's edited averages per mode: a number, null for a cleared input, or absent for the
   * default. Ignored for battle modes (fixed at 1). */
  averages: Readonly<Partial<Record<HseTokenMode, number | null>>>
  pointsSoFar: number
}

export type HseProjectionMode = HseModeScoring & {
  tokens: number
  /** Units per token, or null while the player has not entered one. */
  average: number | null
  /** True for a battle mode: one battle per token, not editable. */
  fixedAverage: boolean
  /** tokens x average x points per unit, or null without an average. */
  points: number | null
}

export type HseProjection = {
  /** The tier's final cumulative milestone. */
  target: number
  repeatStep: number | null
  repeatCap: number | null
  pointsSoFar: number
  /** max(0, target - pointsSoFar). */
  remaining: number
  /** True once points so far reach the final milestone. */
  finalReached: boolean
  /** Repeat steps already reached by points so far. */
  repeatsSoFar: number
  /** Unlocked scoring modes, in token-mode order. */
  modes: HseProjectionMode[]
  /** Scoring modes whose bucket is not unlocked. */
  lockedModes: HseTokenMode[]
  /** ceil(remaining / points per unit), when every shown mode counts kills (or every one waves) at the
   * same points per unit; null otherwise. */
  unitsToFinal: number | null
  /** remaining / sum(tokens x points per unit) in the shared unit, else remaining / sum(tokens) in
   * event points, rounded up to one decimal; null with no tokens at all. */
  requiredPerToken: { value: number; unit: "kills" | "waves" | "points" } | null
  /** Null while any shown mode has no average. */
  projected: {
    points: number
    milestonesReached: number
    milestoneCount: number
    /** Cumulative points of the last milestone reached, or null for none. */
    lastReachedPoints: number | null
    /** Points to the next milestone or repeat step; null once the repeat cap is reached or there is
     * nothing after the final milestone. */
    pointsToNext: number | null
    /** floor((points - target) / repeatStep), capped by the repeat cap; 0 below the target. */
    repeats: number
  } | null
}

/** Rounds up to one decimal, ignoring floating-point dust (8.8000000001 stays 8.8). */
export function ceilToTenth(value: number): number {
  return Math.ceil(Math.round(value * 1e6) / 1e5) / 10
}

function repeatsAt(
  points: number,
  target: number,
  repeat: GameCatalogHseTier["repeat"]
): number {
  if (!repeat || points < target) return 0
  const repeats = Math.floor((points - target) / repeat.points)
  return repeat.cap === null ? repeats : Math.min(repeats, repeat.cap)
}

/**
 * The points projection of a personal event (design D2): what reaching the final milestone takes per
 * token, and where the player's averages land. Null when no tracker scores in a token mode.
 */
export function projectHsePoints(
  input: HseProjectionInput
): HseProjection | null {
  const scoring = hseModeScoring(input.trackers)
  if (scoring.length === 0) return null
  const { milestones, repeat } = input.tier
  const target = milestones.at(-1)!.requiredPoints
  const pointsSoFar = Math.max(0, input.pointsSoFar)
  const remaining = Math.max(0, target - pointsSoFar)

  const lockedModes: HseTokenMode[] = []
  const modes: HseProjectionMode[] = []
  for (const mode of scoring) {
    const tokens = input.tokens[mode.mode]
    if (tokens === null) {
      lockedModes.push(mode.mode)
      continue
    }
    const fixedAverage = mode.unit === "battles"
    const edited = input.averages[mode.mode]
    const average = fixedAverage
      ? 1
      : edited === undefined
        ? hseDefaultAverage(mode.mode, mode.unit)
        : edited
    modes.push({
      ...mode,
      tokens,
      average,
      fixedAverage,
      points: average === null ? null : tokens * average * mode.pointsPerUnit,
    })
  }

  const first = modes[0]
  const shared =
    first &&
    first.unit !== "battles" &&
    modes.every(
      (mode) =>
        mode.unit === first.unit && mode.pointsPerUnit === first.pointsPerUnit
    )
      ? first
      : null
  const unitsToFinal = shared
    ? Math.ceil(remaining / shared.pointsPerUnit)
    : null

  const tokenTotal = modes.reduce((sum, mode) => sum + mode.tokens, 0)
  const pointCapacity = modes.reduce(
    (sum, mode) => sum + mode.tokens * mode.pointsPerUnit,
    0
  )
  const requiredPerToken =
    tokenTotal === 0
      ? null
      : shared
        ? {
            value: ceilToTenth(remaining / pointCapacity),
            unit: shared.unit as "kills" | "waves",
          }
        : {
            value: ceilToTenth(remaining / tokenTotal),
            unit: "points" as const,
          }

  const complete =
    modes.length > 0 && modes.every((mode) => mode.points !== null)
  let projected: HseProjection["projected"] = null
  if (complete) {
    const points = Math.floor(
      pointsSoFar + modes.reduce((sum, mode) => sum + (mode.points ?? 0), 0)
    )
    const reached = milestones.filter(
      (milestone) => milestone.requiredPoints <= points
    )
    const repeats = repeatsAt(points, target, repeat)
    const next = milestones[reached.length]
    const pointsToNext = next
      ? next.requiredPoints - points
      : repeat && (repeat.cap === null || repeats < repeat.cap)
        ? target + (repeats + 1) * repeat.points - points
        : null
    projected = {
      points,
      milestonesReached: reached.length,
      milestoneCount: milestones.length,
      lastReachedPoints: reached.at(-1)?.requiredPoints ?? null,
      pointsToNext,
      repeats,
    }
  }

  return {
    target,
    repeatStep: repeat?.points ?? null,
    repeatCap: repeat?.cap ?? null,
    pointsSoFar,
    remaining,
    finalReached: pointsSoFar >= target,
    repeatsSoFar: repeatsAt(pointsSoFar, target, repeat),
    modes,
    lockedModes,
    unitsToFinal,
    requiredPerToken,
    projected,
  }
}
