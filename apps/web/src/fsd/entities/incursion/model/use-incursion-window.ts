import { useMemo } from "react"

import { useCatalogDataset } from "@/shared/local-data"

import { incursionWindow, type IncursionWindow } from "./incursion-window"

/** The Incursion running at `nowMs` or the next one, from the cached game-events calendar. */
export function useIncursionWindow(nowMs: number): IncursionWindow | null {
  const calendar = useCatalogDataset("events-calendar")
  return useMemo(
    () =>
      calendar.status === "ready"
        ? incursionWindow(calendar.data, nowMs)
        : null,
    [calendar, nowMs]
  )
}
