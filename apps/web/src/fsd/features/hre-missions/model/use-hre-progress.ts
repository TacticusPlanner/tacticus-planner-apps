import { useCallback, useMemo, useState } from "react"

import {
  advanceMission,
  clampProgress,
  DEFAULT_HRE_PROGRESS,
  HRE_PROGRESS_ORDER,
  normalizeHreProgress,
  parseHreProgress,
  switchMission,
  type HreProgress,
} from "./hre-progress"
import type { HreMission } from "./hre-missions"
import type { HreOwnedInput } from "./hre-pace"
import { accountStorageKey, safeStorage } from "@/shared/lib"

// Design D4: one entry per HRE instance (occurrence id), per browser. Every storage access is
// guarded, so a private window or blocked site data degrades to in-memory progress. Account data:
// kept under the account prefix, so sign-out removes it.
export const HRE_PROGRESS_STORAGE_KEY = accountStorageKey(
  "dailies.hre.progress.v1"
)

function readAll(): Record<string, HreProgress> {
  try {
    const raw = safeStorage.get(HRE_PROGRESS_STORAGE_KEY)
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
  // Best-effort: the in-memory value still updates.
  safeStorage.set(
    HRE_PROGRESS_STORAGE_KEY,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(entries).map(([key, entry]) => [
          key,
          { ...entry, order: HRE_PROGRESS_ORDER },
        ])
      )
    )
  )
}

export type HreProgressActions = {
  setMission: (mission: number) => void
  setObjectiveProgress: (index: 0 | 1, value: number) => void
  completeMission: () => void
  /** Puts back a whole earlier entry (Undo after "Mission complete"). */
  restore: (entry: HreProgress) => void
  setPoints: (points: number | null) => void
  /** Sets the rank and, when it changes, the time it was entered. */
  setRank: (rank: number | null) => void
  setTarget: (target: string | null) => void
  setOwned: (owned: Partial<HreOwnedInput>) => void
}

/**
 * The stored progress of one HRE instance, fitted to the event's served `missions`, and its edits;
 * `key` null keeps defaults in memory. Edits wait for the missions (none while they load).
 */
export function useHreProgress(
  key: string | null,
  missions: readonly HreMission[]
): [HreProgress, HreProgressActions] {
  const [all, setAll] = useState(readAll)
  const stored = (key && all[key]) || DEFAULT_HRE_PROGRESS
  const state = useMemo(
    () =>
      missions.length > 0 ? normalizeHreProgress(stored, missions) : stored,
    [stored, missions]
  )

  const update = useCallback(
    (change: (current: HreProgress) => HreProgress) => {
      if (!key || missions.length === 0) return
      setAll((previous) => {
        const current = normalizeHreProgress(
          previous[key] ?? DEFAULT_HRE_PROGRESS,
          missions
        )
        const next = { ...previous, [key]: change(current) }
        writeAll(next)
        return next
      })
    },
    [key, missions]
  )

  const actions: HreProgressActions = {
    setMission: (mission) =>
      update((current) => switchMission(current, missions, mission)),
    setObjectiveProgress: (index, value) =>
      update((current) => {
        const progress: [number, number] = [...current.progress]
        progress[index] = value
        return {
          ...current,
          progress: clampProgress(missions, current.mission, progress),
        }
      }),
    completeMission: () =>
      update((current) => advanceMission(current, missions)),
    restore: (entry) => update(() => entry),
    setPoints: (points) => update((current) => ({ ...current, points })),
    setRank: (rank) =>
      update((current) =>
        rank === current.rank
          ? current
          : { ...current, rank, rankAt: rank === null ? null : Date.now() }
      ),
    setTarget: (target) => update((current) => ({ ...current, target })),
    setOwned: (owned) =>
      update((current) => ({
        ...current,
        owned: { ...current.owned, ...owned },
      })),
  }
  return [state, actions]
}
