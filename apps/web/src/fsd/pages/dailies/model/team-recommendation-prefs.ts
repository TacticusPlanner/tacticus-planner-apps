import { useCallback, useState } from "react"

import { TEAM_SIZES, type TeamMode } from "./team-recommendations.types"
import type { TeamPreferences } from "./team-recommendations.types"

// A full five-character team by default — the player narrows it with the Team size control when
// they want to concentrate a battle's shared XP.
const DEFAULT_TEAM_SIZE = 5

/**
 * The XP/Power mode toggle, persisted per browser under `storageKey` so it survives navigation
 * away from the page and a full reload. Both `localStorage` ends are guarded — a private window or
 * a browser that blocks site data degrades to an in-memory default of `"xp"`. Each Dailies team
 * page passes its own key so the pages do not share a mode.
 */
export function usePersistedMode(
  storageKey: string
): [TeamMode, (mode: TeamMode) => void] {
  const read = useCallback((): TeamMode => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw === "power" || raw === "xp" ? raw : "xp"
    } catch {
      return "xp"
    }
  }, [storageKey])

  const [mode, setModeState] = useState<TeamMode>(read)
  const setMode = useCallback(
    (next: TeamMode) => {
      setModeState(next)
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // Best-effort — the in-memory value still updates.
      }
    },
    [storageKey]
  )
  return [mode, setMode]
}

/**
 * The page-level Team size (3–5), persisted per browser under `storageKey` exactly like the
 * XP/Power mode. A stored value outside the offered set, or a `localStorage` failure, falls back to
 * the five-character default.
 */
export function usePersistedTeamSize(
  storageKey: string
): [number, (size: number) => void] {
  const read = useCallback((): number => {
    try {
      const raw = Number(window.localStorage.getItem(storageKey))
      return TEAM_SIZES.includes(raw) ? raw : DEFAULT_TEAM_SIZE
    } catch {
      return DEFAULT_TEAM_SIZE
    }
  }, [storageKey])

  const [teamSize, setTeamSizeState] = useState<number>(read)
  const setTeamSize = useCallback(
    (next: number) => {
      setTeamSizeState(next)
      try {
        window.localStorage.setItem(storageKey, String(next))
      } catch {
        // Best-effort — the in-memory value still updates.
      }
    },
    [storageKey]
  )
  return [teamSize, setTeamSize]
}

/**
 * The selected alliance track, persisted per browser under `storageKey` (same guard shape as the
 * mode toggle). `isValid` validates a stored string and `fallback` is used on a first visit, a bad
 * stored value, or a `localStorage` failure. Shared by the Salvage Run and Onslaught pages, each
 * with its own key so the pages do not share a track.
 */
export function usePersistedTrack<T extends string>(
  storageKey: string,
  isValid: (value: unknown) => value is T,
  fallback: T
): [T, (track: T) => void] {
  const read = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return isValid(raw) ? raw : fallback
    } catch {
      return fallback
    }
  }, [storageKey, isValid, fallback])

  const [track, setTrackState] = useState<T>(read)
  const setTrack = useCallback(
    (next: T) => {
      setTrackState(next)
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // Best-effort — the in-memory value still updates.
      }
    },
    [storageKey]
  )
  return [track, setTrack]
}

function readStoredPreferences(storageKey: string): TeamPreferences {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next: TeamPreferences = {}
    if (typeof parsed.trait === "string" && parsed.trait) {
      next.trait = parsed.trait
    }
    if (typeof parsed.damageType === "string" && parsed.damageType) {
      next.damageType = parsed.damageType
    }
    return next
  } catch {
    return {}
  }
}

/**
 * The Preferred trait / Preferred damage type selection, persisted per browser under `storageKey`
 * as one JSON value (same guard shape as the mode toggle). `setPreferences` is a merge-patch — pass
 * `{ trait: undefined }` to clear just that field. A stored value that is not a plain
 * `{ trait?, damageType? }` of strings degrades to "no preference".
 */
export function usePersistedPreferences(
  storageKey: string
): [TeamPreferences, (next: Partial<TeamPreferences>) => void] {
  const [preferences, setPreferencesState] = useState<TeamPreferences>(() =>
    readStoredPreferences(storageKey)
  )
  const setPreferences = useCallback(
    (patch: Partial<TeamPreferences>) => {
      setPreferencesState((prev) => {
        const merged: TeamPreferences = { ...prev, ...patch }
        if (!merged.trait) delete merged.trait
        if (!merged.damageType) delete merged.damageType
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(merged))
        } catch {
          // Best-effort — the in-memory value still updates.
        }
        return merged
      })
    },
    [storageKey]
  )
  return [preferences, setPreferences]
}
