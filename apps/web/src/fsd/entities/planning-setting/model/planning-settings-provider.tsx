import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMsal } from "@azure/msal-react"

import {
  getPlanningSettings,
  updatePlanningSettings,
} from "../api/planning-settings.api"
import {
  PlanningSettingsContext,
  type PlanningSettingsContextValue,
} from "./planning-settings-context"
import { defaultPlanningSettings } from "./types"

export function PlanningSettingsProvider({
  children,
}: {
  children: ReactNode
}) {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const [settings, setSettings] = useState(defaultPlanningSettings)
  const [loading, setLoading] = useState(Boolean(account))

  useEffect(() => {
    if (!account) return
    let active = true
    void getPlanningSettings(instance, account).then(
      (value) => {
        if (active) setSettings(value)
        if (active) setLoading(false)
      },
      () => {
        if (active) setLoading(false)
      }
    )
    return () => {
      active = false
    }
  }, [instance, account])

  const value = useMemo<PlanningSettingsContextValue>(
    () => ({
      settings,
      loading,
      save: async (next) => {
        if (!account) return
        const saved = await updatePlanningSettings(instance, account, next)
        setSettings(saved)
      },
    }),
    [account, instance, loading, settings]
  )

  return (
    <PlanningSettingsContext value={value}>{children}</PlanningSettingsContext>
  )
}
