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

/** @deprecated Production data is provided by usePlanningSettings and TanStack Query. */
export function PlanningSettingsProvider({
  children,
}: {
  children: ReactNode
}) {
  const { instance, accounts } = useMsal()
  const accountId = (instance.getActiveAccount() ?? accounts[0])?.homeAccountId
  const [settings, setSettings] = useState(defaultPlanningSettings)
  const [settledAccountId, setSettledAccountId] = useState<string>()
  const loading = Boolean(accountId && settledAccountId !== accountId)

  useEffect(() => {
    if (!accountId) return
    let active = true
    void getPlanningSettings().then(
      (value) => {
        if (active) setSettings(value)
        if (active) setSettledAccountId(accountId)
      },
      () => {
        if (active) setSettledAccountId(accountId)
      }
    )
    return () => {
      active = false
    }
  }, [accountId])

  const value = useMemo<PlanningSettingsContextValue>(
    () => ({
      settings,
      loading,
      save: async (next) => {
        const saved = await updatePlanningSettings(next)
        setSettings(saved)
        setSettledAccountId(accountId)
      },
    }),
    [accountId, loading, settings]
  )

  return (
    <PlanningSettingsContext value={value}>{children}</PlanningSettingsContext>
  )
}
