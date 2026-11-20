import { useEffect, useEffectEvent } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

import { nextTokenCardState } from "../lib/token-plan-view"
import type { TokenPlanView } from "../lib/token-plan-view"

/** Reports `legendary_event_next_token_shown` once per page view and card state (design D9). */
export function useNextTokenShown(eventId: string, view: TokenPlanView) {
  const { captureEvent } = useAnalyticsActions()
  const state = nextTokenCardState(view)
  const planLength = view.kind === "ready" ? view.plan.tokens.length : 0
  const tokensLeftOver =
    view.kind === "ready" ? (view.leftover?.tokens ?? 0) : 0
  // Reads the plan's length and leftover when it fires: they change with every mark and sync.
  const reportShown = useEffectEvent((shown: NonNullable<typeof state>) => {
    captureEvent({
      type: "legendary_event_next_token_shown",
      eventId,
      state: shown,
      planLength,
      tokensLeftOver,
    })
  })
  // Once per page view, event and card state (and once the analytics client loads).
  useEffect(() => {
    if (state) reportShown(state)
  }, [eventId, state, captureEvent])
}
