import { useCallback, useState } from "react"

import { HSE_TOKEN_MODES, type HseTokenMode } from "../lib/hse-token-supply"

// Design D5: averages persist per browser by (definition, mode), points so far by instance. Both are
// this tab's own keys (no other Dailies tab reads them) and every storage access is guarded, so a
// private window or blocked site data degrades to in-memory values.
export const HSE_AVERAGES_STORAGE_KEY = "tp.dailies.hse.averages.v1"
export const HSE_POINTS_SO_FAR_STORAGE_KEY = "tp.dailies.hse.pointsSoFar.v1"

/** Edited averages of one definition: a number, or null for an input the player cleared. */
type HseAverages = Partial<Record<HseTokenMode, number | null>>

type StoredAverages = Record<string, HseAverages>
type StoredPointsSoFar = Record<string, number>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isAverage = (value: unknown): value is number | null =>
  value === null ||
  (typeof value === "number" && Number.isFinite(value) && value >= 0)

function readJson(key: string): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Best-effort — the in-memory value still updates.
  }
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

function readPointsSoFar(): StoredPointsSoFar {
  const stored: StoredPointsSoFar = {}
  for (const [instanceKey, points] of Object.entries(
    readJson(HSE_POINTS_SO_FAR_STORAGE_KEY)
  )) {
    if (typeof points === "number" && Number.isFinite(points) && points >= 0)
      stored[instanceKey] = points
  }
  return stored
}

const NO_AVERAGES: HseAverages = {}

export type HseProjectionInputs = {
  averages: HseAverages
  setAverage: (mode: HseTokenMode, value: number | null) => void
  pointsSoFar: number
  setPointsSoFar: (points: number) => void
}

/**
 * The projection's editable inputs for one definition and instance: the per-mode averages (absent
 * means the default) and the points so far (0 by default).
 */
export function useHseProjectionInputs(
  definitionId: string,
  instanceKey: string
): HseProjectionInputs {
  const [averagesByDefinition, setAveragesByDefinition] =
    useState<StoredAverages>(readAverages)
  const [pointsByInstance, setPointsByInstance] =
    useState<StoredPointsSoFar>(readPointsSoFar)

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

  const setPointsSoFar = useCallback(
    (points: number) =>
      setPointsByInstance((previous) => {
        const next = { ...previous, [instanceKey]: Math.max(0, points) }
        writeJson(HSE_POINTS_SO_FAR_STORAGE_KEY, next)
        return next
      }),
    [instanceKey]
  )

  return {
    averages: averagesByDefinition[definitionId] ?? NO_AVERAGES,
    setAverage,
    pointsSoFar: pointsByInstance[instanceKey] ?? 0,
    setPointsSoFar,
  }
}
