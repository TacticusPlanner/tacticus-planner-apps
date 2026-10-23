import { createContext, useContext } from "react"

import type { PlayerDataSyncProgress } from "@workspace/player-data"

// The player-data sync status every layer reads: `app`'s PlayerDataProvider owns the sync and
// provides it, while any slice (the shell's Sync controls, a page's "sync to see this" prompt) reads
// it through `usePlayerDataStatus`. Lives in shared/ so pages and features can reach it - they may
// not import `app`.
export type PlayerDataStatus = "idle" | "syncing" | "ready" | "stale" | "error"

export type PlayerDataContextValue = {
  status: PlayerDataStatus
  lastSyncedAt: string | null
  error: string | null
  // True when `error` is not a transient failure — acquireAccessToken could not renew the session
  // silently, so retrying the same sync will just fail the same way. The UI should offer to sign in
  // again (via requestApiAccess/loginRedirect) instead of a plain "try again".
  requiresReauth: boolean
  syncNow: () => void
}

export const PlayerDataContext = createContext<
  PlayerDataContextValue | undefined
>(undefined)

// Per-chunk sync progress lives in its own context: it ticks many times per sync, and only the
// controls that show it should re-render on a tick, not every status reader (the shell among them).
export const PlayerDataProgressContext =
  createContext<PlayerDataSyncProgress | null>(null)

export function usePlayerDataStatus() {
  const context = useContext(PlayerDataContext)

  if (!context) {
    throw new Error(
      "usePlayerDataStatus must be used within PlayerDataProvider."
    )
  }

  return context
}

/** The running sync's progress, or null between syncs. Read it only where it is displayed. */
export function usePlayerDataProgress() {
  return useContext(PlayerDataProgressContext)
}
