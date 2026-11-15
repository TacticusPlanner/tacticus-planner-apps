import {
  HRE_REORDERED_MISSIONS,
  hreAllDone,
  hreMission,
  type HreMission,
} from "./hre-missions"
import type { HreOwnedInput } from "./hre-pace"
import { HRE_RARITY_STEP_IDS } from "./hre-reward-tables"

/** The player's own record of one HRE instance, kept in this browser only. */
export type HreProgress = {
  /** The current mission from 1; one past the last once every mission is done (`hreAllDone`). */
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
  missions: readonly HreMission[],
  mission: number,
  progress: readonly number[]
): [number, number] {
  if (mission >= hreAllDone(missions)) return [0, 0]
  const [first, second] = hreMission(missions, mission).objectives
  const clamp = (value: number | undefined, target: number) =>
    Math.min(Math.max(Math.floor(value ?? 0), 0), target)
  return [clamp(progress[0], first.target), clamp(progress[1], second.target)]
}

const wholePair = (value: unknown): [number, number] => {
  const raw = (Array.isArray(value) ? value : []).map(
    (item: unknown) => wholeAtLeast(item, 0) ?? 0
  )
  return [raw[0] ?? 0, raw[1] ?? 0]
}

/** One stored entry, or null when it is not a valid record (invalid entries are dropped). Values are
 *  kept as stored: `normalizeHreProgress` fits them to the served missions. */
export function parseHreProgress(value: unknown): HreProgress | null {
  if (!isRecord(value)) return null
  const mission = wholeAtLeast(value.mission, 1)
  if (mission === null) return null
  const [first, second] = wholePair(value.progress)
  const oldOrder =
    value.order !== HRE_PROGRESS_ORDER && HRE_REORDERED_MISSIONS.has(mission)
  return {
    mission,
    progress: oldOrder ? [second, first] : [first, second],
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
    if (!Number.isInteger(mission) || mission < 1) continue
    if (!Array.isArray(pair)) continue
    entries[mission] = wholePair(pair)
  }
  return entries
}

function parseOwned(value: unknown): HreOwnedInput {
  if (!isRecord(value)) return EMPTY_HRE_OWNED
  const nextTier = wholeAtLeast(value.nextTier, 1)
  const step =
    value.step === "none" ||
    HRE_RARITY_STEP_IDS.some((item) => item.id === value.step)
      ? (value.step as string)
      : null
  return {
    currency: wholeAtLeast(value.currency, 0),
    // The pace clamps the tier to the served chests (`ownedFrom`).
    nextTier,
    step,
    toNext: wholeAtLeast(value.toNext, 0),
  }
}

/** A stored entry fitted to the served missions: the mission within the chain (or done) and every
 *  objective's progress clamped to its target. */
export function normalizeHreProgress(
  state: HreProgress,
  missions: readonly HreMission[]
): HreProgress {
  const allDone = hreAllDone(missions)
  const mission = Math.min(state.mission, allDone)
  const byMission: Record<number, [number, number]> = {}
  for (const [key, pair] of Object.entries(state.byMission)) {
    const number = Number(key)
    if (number < allDone)
      byMission[number] = clampProgress(missions, number, pair)
  }
  return {
    ...state,
    mission,
    progress: clampProgress(missions, mission, state.progress),
    byMission,
  }
}

/** Choosing a mission keeps the current one's values and restores the chosen one's (design D3). */
export function switchMission(
  state: HreProgress,
  missions: readonly HreMission[],
  mission: number
): HreProgress {
  if (mission === state.mission) return state
  const byMission = { ...state.byMission }
  if (state.mission < hreAllDone(missions))
    byMission[state.mission] = state.progress
  return {
    ...state,
    mission,
    progress: clampProgress(missions, mission, byMission[mission] ?? [0, 0]),
    byMission,
  }
}

/** Both objectives of the current mission are at their targets. */
export function isMissionComplete(
  state: HreProgress,
  missions: readonly HreMission[]
): boolean {
  if (state.mission >= hreAllDone(missions)) return false
  const [first, second] = hreMission(missions, state.mission).objectives
  return state.progress[0] >= first.target && state.progress[1] >= second.target
}

/** "Mission complete": keeps the finished values, then the next mission with both values at 0. */
export function advanceMission(
  state: HreProgress,
  missions: readonly HreMission[]
): HreProgress {
  const allDone = hreAllDone(missions)
  const byMission = { ...state.byMission }
  if (state.mission < allDone) byMission[state.mission] = state.progress
  return {
    ...state,
    mission: Math.min(state.mission + 1, allDone),
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
