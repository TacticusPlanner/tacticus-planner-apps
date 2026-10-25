import {
  HRE_MISSIONS,
  HRE_REORDERED_MISSIONS,
  hreMission,
} from "./hre-missions"
import type { HreOwnedInput } from "./hre-pace"
import { HRE_CHESTS, HRE_RARITY_STEPS } from "./hre-reward-tables"

/** The player's own record of one HRE instance, kept in this browser only. */
export type HreProgress = {
  /** The current mission, 1 to 21; 22 once every mission is done. */
  mission: number
  /** Progress on the current mission's two objectives, each clamped to its target. */
  progress: [number, number]
  /** Event points so far, or null when not entered. */
  points: number | null
  /** Leaderboard position, or null when not entered. */
  rank: number | null
  /** The chosen pace target step id, or null for the default. */
  target: string | null
  /** When the rank was entered (ms), or null when unknown. */
  rankAt: number | null
  /** Each mission's two values as last left (design D3); `progress` holds the current one's. */
  byMission: Record<number, [number, number]>
  /** The pace card's owned inputs, each null until entered (design D1). */
  owned: HreOwnedInput
}

const EMPTY_HRE_OWNED: HreOwnedInput = {
  currency: null,
  nextTier: null,
  step: null,
  toNext: null,
}

export const HRE_ALL_DONE = HRE_MISSIONS.length + 1

/** The objective order a stored entry's progress follows: 2 is the game's order; entries without it
 * predate the reorder (`HRE_REORDERED_MISSIONS`). */
export const HRE_PROGRESS_ORDER = 2

export const DEFAULT_HRE_PROGRESS: HreProgress = {
  mission: 1,
  progress: [0, 0],
  points: null,
  rank: null,
  target: null,
  rankAt: null,
  byMission: {},
  owned: EMPTY_HRE_OWNED,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const wholeAtLeast = (value: unknown, min: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= min
    ? Math.floor(value)
    : null

/** Clamps each objective's progress to 0..target for the given mission. */
export function clampProgress(
  mission: number,
  progress: readonly number[]
): [number, number] {
  if (mission >= HRE_ALL_DONE) return [0, 0]
  const [first, second] = hreMission(mission).objectives
  const clamp = (value: number | undefined, target: number) =>
    Math.min(Math.max(Math.floor(value ?? 0), 0), target)
  return [clamp(progress[0], first.target), clamp(progress[1], second.target)]
}

/** One stored entry, or null when it is not a valid record (invalid entries are dropped). */
export function parseHreProgress(value: unknown): HreProgress | null {
  if (!isRecord(value)) return null
  const mission = wholeAtLeast(value.mission, 1)
  if (mission === null || mission > HRE_ALL_DONE) return null
  const raw = (Array.isArray(value.progress) ? value.progress : []).map(
    (item: unknown) => wholeAtLeast(item, 0) ?? 0
  )
  const oldOrder =
    value.order !== HRE_PROGRESS_ORDER && HRE_REORDERED_MISSIONS.has(mission)
  const progress = clampProgress(
    mission,
    oldOrder ? [raw[1] ?? 0, raw[0] ?? 0] : raw
  )
  return {
    mission,
    progress,
    points: wholeAtLeast(value.points, 0),
    rank: wholeAtLeast(value.rank, 1),
    target: typeof value.target === "string" ? value.target : null,
    rankAt: wholeAtLeast(value.rankAt, 0),
    byMission: parseByMission(value.byMission),
    owned: parseOwned(value.owned),
  }
}

// The fields added after the first release are optional: an invalid one is dropped alone.
function parseByMission(value: unknown): Record<number, [number, number]> {
  if (!isRecord(value)) return {}
  const entries: Record<number, [number, number]> = {}
  for (const [key, pair] of Object.entries(value)) {
    const mission = Number(key)
    if (!Number.isInteger(mission) || mission < 1 || mission >= HRE_ALL_DONE)
      continue
    if (!Array.isArray(pair)) continue
    entries[mission] = clampProgress(
      mission,
      pair.map((item: unknown) => wholeAtLeast(item, 0) ?? 0)
    )
  }
  return entries
}

function parseOwned(value: unknown): HreOwnedInput {
  if (!isRecord(value)) return EMPTY_HRE_OWNED
  const nextTier = wholeAtLeast(value.nextTier, 1)
  const step =
    value.step === "none" ||
    HRE_RARITY_STEPS.some((item) => item.id === value.step)
      ? (value.step as string)
      : null
  return {
    currency: wholeAtLeast(value.currency, 0),
    nextTier:
      nextTier !== null && nextTier <= HRE_CHESTS.length ? nextTier : null,
    step,
    toNext: wholeAtLeast(value.toNext, 0),
  }
}

/** Choosing a mission keeps the current one's values and restores the chosen one's (design D3). */
export function switchMission(
  state: HreProgress,
  mission: number
): HreProgress {
  if (mission === state.mission) return state
  const byMission = { ...state.byMission }
  if (state.mission < HRE_ALL_DONE) byMission[state.mission] = state.progress
  return {
    ...state,
    mission,
    progress: clampProgress(mission, byMission[mission] ?? [0, 0]),
    byMission,
  }
}

/** Both objectives of the current mission are at their targets. */
export function isMissionComplete(state: HreProgress): boolean {
  if (state.mission >= HRE_ALL_DONE) return false
  const [first, second] = hreMission(state.mission).objectives
  return state.progress[0] >= first.target && state.progress[1] >= second.target
}

/** "Mission complete": keeps the finished values, then the next mission with both values at 0. */
export function advanceMission(state: HreProgress): HreProgress {
  const byMission = { ...state.byMission }
  if (state.mission < HRE_ALL_DONE) byMission[state.mission] = state.progress
  return {
    ...state,
    mission: Math.min(state.mission + 1, HRE_ALL_DONE),
    progress: [0, 0],
    byMission,
  }
}

export type HreMissionStatus = "done" | "current" | "locked" | "preview"

/** A mission's state against the current mission number (null: a read-only preview). */
export function missionStatus(
  number: number,
  current: number | null
): HreMissionStatus {
  if (current === null) return "preview"
  if (number < current) return "done"
  return number === current ? "current" : "locked"
}
