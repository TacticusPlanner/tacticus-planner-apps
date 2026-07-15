import { useContext } from "react"

import { PlanningSettingsContext } from "./planning-settings-context"

export function usePlanningSettings() {
  return useContext(PlanningSettingsContext)
}
