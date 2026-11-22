import { useEffect, useRef } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

type HreEventState = "running" | "upcoming" | "past"

/**
 * Reports `hre_tab_viewed` once per shown event (its key) while the tab is open: its state and, on a
 * running event, the current mission when it was first shown. A key counts as reported only once the
 * analytics client is ready, so an event shown before it loads is still reported.
 */
export function useHreTabViewed(
  eventState: HreEventState | null,
  mission: number | null,
  eventKey: string | null
) {
  const { captureEvent, isReady } = useAnalyticsActions()
  const reported = useRef(new Set<string>())
  useEffect(() => {
    if (!isReady || !eventState || !eventKey || reported.current.has(eventKey))
      return
    reported.current.add(eventKey)
    captureEvent({ type: "hre_tab_viewed", eventState, mission })
  }, [captureEvent, isReady, eventState, eventKey, mission])
}
