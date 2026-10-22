import { useCallback, useState } from "react"

import {
  NO_HSE_MILESTONE_PROGRESS,
  type HseMilestoneProgress,
} from "../lib/hse-milestones"
import { HSE_TOKEN_MODES, type HseTokenMode } from "../lib/hse-token-supply"
import { safeStorage } from "@/shared/lib"

// Design D5: averages persist per browser by (definition, mode), milestone progress by instance. Both are
// this tab's own keys (no other Dailies tab reads them) and every storage access is guarded, so a
// private window or blocked site data degrades to in-memory values.
export const HSE_AVERAGES_STORAGE_KEY = "tp.dailies.hse.averages.v1"
// v2 holds milestones done and points in the current one (the game restarts at 0 per milestone);
// v1's cumulative totals are no longer read.
export const HSE_PROGRESS_STORAGE_KEY = "tp.dailies.hse.progress.v2"

/** Edited averages of one definition: a number, or null for an input the player cleared. */
type HseAverages = Partial<Record<HseTokenMode, number | null>>

type StoredAverages = Record<string, HseAverages>
type StoredProgress = Record<string, HseMilestoneProgress>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isAverage = (value: unknown): value is number | null =>
  value === null ||
  (typeof value === "number" && Number.isFinite(value) && value >= 0)

function readJson(key: string): Record<string, unknown> {
  try {
    const raw = safeStorage.get(key)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeJson(key: string, value: unknown) {
  // Best-effort — the in-memory value still updates.
  safeStorage.set(key, JSON.stringify(value))
}

function readAverages(): StoredAverages {
  const stored: StoredAverages = {}
  for (const [definitionId, modes] of Object.entries(
    readJson(HSE_AVERAGES_STORAGE_KEY)
  )) {
    if (!isRecord(modes)) continue
    const averages: HseAverages = {}
    for (const mode of HSE_TOKEN_MODES) {
      if (mode in modes && isAverage(modes[mode])) averages[mode] = modes[mode]
    }
    stored[definitionId] = averages
  }
  return stored
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0

function readProgress(): StoredProgress {
  const stored: StoredProgress = {}
  for (const [instanceKey, progress] of Object.entries(
    readJson(HSE_PROGRESS_STORAGE_KEY)
  )) {
    if (
      isRecord(progress) &&
      isCount(progress.milestonesDone) &&
      isCount(progress.pointsInMilestone)
    )
      stored[instanceKey] = {
        milestonesDone: progress.milestonesDone,
        pointsInMilestone: progress.pointsInMilestone,
      }
  }
  return stored
}

const NO_AVERAGES: HseAverages = {}

export type HseProjectionInputs = {
  averages: HseAverages
  setAverage: (mode: HseTokenMode, value: number | null) => void
  progress: HseMilestoneProgress
  setProgress: (progress: Partial<HseMilestoneProgress>) => void
}

/**
 * The projection's editable inputs for one definition and instance: the per-mode averages (absent
 * means the default) and the milestone progress (none by default).
 */
export function useHseProjectionInputs(
  definitionId: string,
  instanceKey: string
): HseProjectionInputs {
  const [averagesByDefinition, setAveragesByDefinition] =
    useState<StoredAverages>(readAverages)
  const [progressByInstance, setProgressByInstance] =
    useState<StoredProgress>(readProgress)

  const setAverage = useCallback(
    (mode: HseTokenMode, value: number | null) =>
      setAveragesByDefinition((previous) => {
        const next = {
          ...previous,
          [definitionId]: { ...previous[definitionId], [mode]: value },
        }
        writeJson(HSE_AVERAGES_STORAGE_KEY, next)
        return next
      }),
    [definitionId]
  )

  const setProgress = useCallback(
    (change: Partial<HseMilestoneProgress>) =>
      setProgressByInstance((previous) => {
        // A new milestone count restarts the points, as the game does after each milestone.
        const merged = {
          ...NO_HSE_MILESTONE_PROGRESS,
          ...previous[instanceKey],
          ...(change.milestonesDone === undefined
            ? {}
            : { pointsInMilestone: 0 }),
          ...change,
        }
        const next = {
          ...previous,
          [instanceKey]: {
            milestonesDone: Math.max(0, Math.floor(merged.milestonesDone)),
            pointsInMilestone: Math.max(0, merged.pointsInMilestone),
          },
        }
        writeJson(HSE_PROGRESS_STORAGE_KEY, next)
        return next
      }),
    [instanceKey]
  )

  return {
    averages: averagesByDefinition[definitionId] ?? NO_AVERAGES,
    setAverage,
    progress: progressByInstance[instanceKey] ?? NO_HSE_MILESTONE_PROGRESS,
    setProgress,
  }
}
