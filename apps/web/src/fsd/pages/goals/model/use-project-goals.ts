import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMsal } from "@azure/msal-react"

import { listProjectGoals, type ProjectGoalSummary } from "@/entities/project"
import { useGoalRefresh } from "@/entities/goal"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: ProjectGoalSummary[] }

/**
 * Loads a single project's member goals + priority (GET /api/v1/me/projects/{id}/goals), the data source
 * for the goals page when a project filter is active — returns every member status (incl. archived/
 * completed) so tab-filtering and reorder both operate on the full ordering. No-ops (`{status:"idle"}`,
 * never fetches) while `projectId` is undefined ("All projects").
 */
export function useProjectGoals(projectId: string | undefined) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const accountRef = useRef(account)
  const instanceRef = useRef(instance)
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
    const currentAccount = accountRef.current
    if (!currentAccount || !projectId) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const data = await listProjectGoals(
        instanceRef.current,
        currentAccount,
        projectId,
        controller.signal
      )
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
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      return undefined
    }

    const unregister = registerRef.current(`project-goals:${projectId}`, load)
    void load()

    return () => {
      unregister()
      abortRef.current?.abort()
    }
  }, [accountId, load, projectId])

  // Gated on `projectId` rather than reset via effect state: when the filter clears, the last fetch's
  // result would otherwise linger in `fetchState` until the next project selection re-fetches.
  const effectiveState: FetchState = projectId ? fetchState : { status: "idle" }

  return {
    fetchState: effectiveState,
    goals: effectiveState.status === "success" ? effectiveState.goals : [],
    loading: Boolean(projectId) && effectiveState.status === "idle",
    retry: load,
  }
}
