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
  const accountId = (instance.getActiveAccount() ?? accounts[0])?.homeAccountId
  const [settings, setSettings] = useState(defaultPlanningSettings)
  const [settledAccountId, setSettledAccountId] = useState<string>()
  const loading = Boolean(accountId && settledAccountId !== accountId)

  useEffect(() => {
    if (!accountId) return

    const account = resolveAccount(instance, accountId)
    if (!account) return

    let active = true
    void getPlanningSettings(instance, account).then(
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
  }, [instance, accountId])

  const value = useMemo<PlanningSettingsContextValue>(
    () => ({
      settings,
      loading,
      save: async (next) => {
        const account = accountId
          ? resolveAccount(instance, accountId)
          : undefined
        if (!account) return
        const saved = await updatePlanningSettings(instance, account, next)
        setSettings(saved)
        setSettledAccountId(accountId)
      },
    }),
    [accountId, instance, loading, settings]
  )

  return (
    <PlanningSettingsContext value={value}>{children}</PlanningSettingsContext>
  )
}

function resolveAccount(
  instance: ReturnType<typeof useMsal>["instance"],
  accountId: string
) {
  const activeAccount = instance.getActiveAccount()
  if (activeAccount?.homeAccountId === accountId) return activeAccount

  return instance
    .getAllAccounts()
    .find((account) => account.homeAccountId === accountId)
}
