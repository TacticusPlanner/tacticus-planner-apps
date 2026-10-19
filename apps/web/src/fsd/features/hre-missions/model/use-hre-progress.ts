import { useCallback, useState } from "react"

import {
  advanceMission,
  clampProgress,
  DEFAULT_HRE_PROGRESS,
  parseHreProgress,
  type HreProgress,
} from "./hre-progress"

// Design D4: one entry per HRE instance (occurrence id), per browser. Every storage access is
// guarded, so a private window or blocked site data degrades to in-memory progress.
export const HRE_PROGRESS_STORAGE_KEY = "tp.dailies.hre.progress.v1"

function readAll(): Record<string, HreProgress> {
  try {
    const raw = window.localStorage.getItem(HRE_PROGRESS_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (typeof parsed !== "object" || parsed === null) return {}
    const entries: Record<string, HreProgress> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const entry = parseHreProgress(value)
      if (entry) entries[key] = entry
    }
    return entries
  } catch {
    return {}
  }
}

function writeAll(entries: Record<string, HreProgress>) {
  try {
    window.localStorage.setItem(
      HRE_PROGRESS_STORAGE_KEY,
      JSON.stringify(entries)
    )
  } catch {
    // Best-effort: the in-memory value still updates.
  }
}

export type HreProgressActions = {
  setMission: (mission: number) => void
  setObjectiveProgress: (index: 0 | 1, value: number) => void
  completeMission: () => void
  setPoints: (points: number | null) => void
  setRank: (rank: number | null) => void
  setTarget: (target: string | null) => void
}

/** The stored progress of one HRE instance and its edits; `key` null keeps defaults in memory. */
export function useHreProgress(
  key: string | null
): [HreProgress, HreProgressActions] {
  const [all, setAll] = useState(readAll)
  const state = (key && all[key]) || DEFAULT_HRE_PROGRESS

  const update = useCallback(
    (change: (current: HreProgress) => HreProgress) => {
      if (!key) return
      setAll((previous) => {
        const next = {
          ...previous,
          [key]: change(previous[key] ?? DEFAULT_HRE_PROGRESS),
        }
        writeAll(next)
        return next
      })
    },
    [key]
  )

  const actions: HreProgressActions = {
    setMission: (mission) =>
      update((current) => ({
        ...current,
        mission,
        progress: mission === current.mission ? current.progress : [0, 0],
      })),
    setObjectiveProgress: (index, value) =>
      update((current) => {
        const progress: [number, number] = [...current.progress]
        progress[index] = value
        return {
          ...current,
          progress: clampProgress(current.mission, progress),
        }
      }),
    completeMission: () => update(advanceMission),
    setPoints: (points) => update((current) => ({ ...current, points })),
    setRank: (rank) => update((current) => ({ ...current, rank })),
    setTarget: (target) => update((current) => ({ ...current, target })),
  }
  return [state, actions]
}
