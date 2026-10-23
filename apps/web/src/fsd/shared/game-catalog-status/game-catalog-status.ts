import { createContext, useContext } from "react"

import type { GameCatalogSyncProgress } from "@workspace/game-catalog"

// The game-catalog sync status: `app`'s GameCatalogProvider owns the sync and provides it, while
// lower layers (the account-menu widget's sync badge) read it through `useGameCatalogStatus`. Lives
// in shared/ so widgets can reach it - they may not import `app`.
export type GameCatalogStatus = "idle" | "syncing" | "ready" | "stale" | "error"

export type GameCatalogContextValue = {
  status: GameCatalogStatus
  progress: GameCatalogSyncProgress | null
  gameVersion: string | null
  firstTime: boolean
  error: string | null
  retry: () => void
}

export const GameCatalogContext = createContext<
  GameCatalogContextValue | undefined
>(undefined)

export function useGameCatalogStatus() {
  const context = useContext(GameCatalogContext)

  if (!context) {
    throw new Error(
      "useGameCatalogStatus must be used within GameCatalogProvider."
    )
  }

  return context
}
