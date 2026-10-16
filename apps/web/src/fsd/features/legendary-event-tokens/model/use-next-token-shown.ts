import { useEffect } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

import { nextTokenCardState, type TokenPlanView } from "../lib/token-plan-view"

/** Reports `legendary_event_next_token_shown` once per page view and card state (design D9). */
export function useNextTokenShown(eventId: string, view: TokenPlanView) {
  const { captureEvent } = useAnalyticsActions()
  const state = nextTokenCardState(view)
  const planLength = view.kind === "ready" ? view.plan.tokens.length : 0
  const tokensLeftOver =
    view.kind === "ready" ? (view.leftover?.tokens ?? 0) : 0
  useEffect(() => {
    if (!state) return
    captureEvent({
      type: "legendary_event_next_token_shown",
      eventId,
      state,
      planLength,
      tokensLeftOver,
    })
    // Once per state: the plan's length and leftover change with every mark and sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, state, captureEvent])
}
