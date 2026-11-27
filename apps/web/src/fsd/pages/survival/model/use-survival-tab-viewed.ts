import { useEffect, useRef } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

import type { SurvivalEventStatus } from "./survival-event"
import type { SurvivalTab } from "./survival-tabs"

/**
 * Reports `survival_tab_viewed` once per shown tab and event while the page is open, with the event's
 * state. A pair counts as reported only once the analytics client is ready.
 */
export function useSurvivalTabViewed(
  tab: SurvivalTab | null,
  eventId: string | null,
  eventState: SurvivalEventStatus | null
) {
  const { captureEvent, isReady } = useAnalyticsActions()
  const reported = useRef(new Set<string>())
  useEffect(() => {
    if (!isReady || !tab || !eventId || !eventState) return
    const key = `${tab}:${eventId}`
    if (reported.current.has(key)) return
    reported.current.add(key)
    captureEvent({ type: "survival_tab_viewed", tab, eventState })
  }, [captureEvent, isReady, tab, eventId, eventState])
}
