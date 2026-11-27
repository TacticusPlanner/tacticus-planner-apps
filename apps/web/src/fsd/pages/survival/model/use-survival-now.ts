import { useEffect, useState } from "react"

import type { SurvivalEvent } from "./survival-event"
import { nextSurvivalBoundary } from "./survival-event-status"

// setTimeout fires at once past a 32-bit delay, so a boundary further off is reached in steps.
const MAX_DELAY_MS = 2_147_483_647

/**
 * The time the page judges event status by. It moves to each event start or end as it passes, so
 * "Running now", the default event and the picker follow the clock while the page stays open.
 */
export function useSurvivalNow(
  events: readonly Pick<SurvivalEvent, "startUtc" | "endUtc">[] | undefined
): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const next = events ? nextSurvivalBoundary(events, now) : null
    if (next === null) return
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(0, next - Date.now()), MAX_DELAY_MS)
    )
    return () => clearTimeout(timer)
  }, [events, now])
  return now
}
