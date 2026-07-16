import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMsal } from "@azure/msal-react"

import { listGoals, useGoalRefresh, type GoalSummary } from "@/entities/goal"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: GoalSummary[] }

/**
 * Loads the caller's goals (GET /api/v1/me/goals) once on mount and exposes a retry callback. Mirrors
 * GuildPage's direct-fetch pattern (no Dexie/react-query — goals are user-owned mutable server data,
 * matching ADR 0003). Pass `archived: true` to load the archived tab instead of the default (non-archived)
 * list.
 */
export function useGoals(options?: { archived?: boolean }) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const accountRef = useRef(account)
  const instanceRef = useRef(instance)
  const archived = options?.archived ?? false
  const abortRef = useRef<AbortController | null>(null)
  const tRef = useRef(t)
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })
  const { registerGoalRefetch } = useGoalRefresh()
  const registerRef = useRef(registerGoalRefetch)

  useEffect(() => {
    accountRef.current = account
    instanceRef.current = instance
    tRef.current = t
    registerRef.current = registerGoalRefetch
  }, [account, instance, registerGoalRefetch, t])

  const load = useCallback(async () => {
    const account = accountRef.current
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFetchState({ status: "idle" })

    try {
      const data = await listGoals(instanceRef.current, account, {
        archived,
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        setFetchState({ status: "success", goals: data.goals })
      }
    } catch (error) {
      if (controller.signal.aborted) return
      setFetchState({
        status: "error",
        message:
          error instanceof ApiError
            ? error.message
            : tRef.current("goals.loadError"),
      })
      throw error
    }
  }, [archived])

  useEffect(() => {
    if (!accountId) return undefined
    const unregister = registerRef.current(`goals:${archived}`, load)
    void load()

    return () => {
      unregister()
      abortRef.current?.abort()
    }
  }, [accountId, archived, load])

  const isLoading = useMemo(
    () => fetchState.status === "idle",
    [fetchState.status]
  )

  return { fetchState, isLoading, retry: load }
}
