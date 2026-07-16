import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  getPlanningSettings,
  updatePlanningSettings,
} from "../api/planning-settings.api"
import {
  PlanningSettingsContext,
  type PlanningSettingsContextValue,
} from "./planning-settings-context"
import { defaultPlanningSettings } from "./types"

/** @deprecated Production data is provided by usePlanningSettings and TanStack Query. */
export function PlanningSettingsProvider({
  children,
}: {
  children: ReactNode
}) {
  const isAuthenticated = useIsAuthenticated()
  const [settings, setSettings] = useState(defaultPlanningSettings)
  const [settled, setSettled] = useState(false)
  const loading = isAuthenticated && !settled

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    void getPlanningSettings().then(
      (value) => {
        if (active) setSettings(value)
        if (active) setSettled(true)
      },
      () => {
        if (active) setSettled(true)
      }
    )
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const value = useMemo<PlanningSettingsContextValue>(
    () => ({
      settings,
      loading,
      save: async (next) => {
        const saved = await updatePlanningSettings(next)
        setSettings(saved)
        setSettled(true)
      },
    }),
    [loading, settings]
  )

  return (
    <PlanningSettingsContext value={value}>{children}</PlanningSettingsContext>
  )
}
