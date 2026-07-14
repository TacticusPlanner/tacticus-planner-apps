import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMsal } from "@azure/msal-react"

import { listGoals, type GoalSummary } from "@/entities/goal"
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
  const archived = options?.archived ?? false
  const abortRef = useRef<AbortController | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const load = useCallback(() => {
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFetchState({ status: "idle" })

    void listGoals(instance, account, {
      archived,
      signal: controller.signal,
    }).then(
      (data) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", goals: data.goals })
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("goals.loadError"),
        })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, account, archived])

  useEffect(() => {
    const currentAccount = instance.getActiveAccount() ?? accounts[0]
    if (!currentAccount) {
      return
    }

    let active = true
    const controller = new AbortController()
    abortRef.current = controller

    void listGoals(instance, currentAccount, {
      archived,
      signal: controller.signal,
    }).then(
      (data) => {
        if (!active) {
          return
        }

        setFetchState({ status: "success", goals: data.goals })
      },
      (error: unknown) => {
        if (!active) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("goals.loadError"),
        })
      }
    )

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, instance, accounts, archived])

  const isLoading = useMemo(
    () => fetchState.status === "idle",
    [fetchState.status]
  )

  return { fetchState, isLoading, retry: load }
}
