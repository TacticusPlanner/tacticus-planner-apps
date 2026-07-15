import { createContext } from "react"

import { defaultPlanningSettings, type PlanningSettings } from "./types"

export type PlanningSettingsContextValue = {
  settings: PlanningSettings
  loading: boolean
  save: (settings: PlanningSettings) => Promise<void>
}

export const PlanningSettingsContext =
  createContext<PlanningSettingsContextValue>({
    settings: defaultPlanningSettings,
    loading: false,
    save: async () => undefined,
  })
