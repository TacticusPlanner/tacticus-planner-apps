import { useOutletContext } from "react-router"

import type { SurvivalEvent, SurvivalEventStatus } from "./survival-event"

/** What the layout hands every tab: the shown event and its status now. */
export interface SurvivalContext {
  event: SurvivalEvent
  status: SurvivalEventStatus
}

export function useSurvivalContext() {
  return useOutletContext<SurvivalContext>()
}
