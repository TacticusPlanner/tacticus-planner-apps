import { useEffect, useRef } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

type HreEventState = "running" | "upcoming" | "past"

/**
 * Reports `hre_tab_viewed` once per shown event (its key) while the tab is open: its state and, on a
 * running event, the current mission when it was first shown.
 */
export function useHreTabViewed(
  eventState: HreEventState | null,
  mission: number | null,
  eventKey: string | null
) {
  const { captureEvent } = useAnalyticsActions()
  const reported = useRef<string | null>(null)
  useEffect(() => {
    if (!eventState || !eventKey || reported.current === eventKey) return
    reported.current = eventKey
    captureEvent({ type: "hre_tab_viewed", eventState, mission })
  }, [captureEvent, eventState, eventKey, mission])
}
