import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMsal } from "@azure/msal-react"

import { listProjects, type ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; projects: ProjectSummary[] }

/**
 * Loads the caller's projects (GET /api/v1/me/projects) once on mount and exposes a retry callback — same
 * direct-fetch shape as `useGoals`. Backs the goals page's project filter/toolbar (group-by-project,
 * active-plan toggle, bulk lifecycle).
 */
export function useProjects() {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const abortRef = useRef<AbortController | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const load = () => {
    const currentAccount = instance.getActiveAccount() ?? accounts[0]
    if (!currentAccount) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    void listProjects(instance, currentAccount, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", projects: data.projects })
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
  }

  useEffect(() => {
    load()

    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  const projects = fetchState.status === "success" ? fetchState.projects : []
  const activeProject = projects.find((project) => project.isActivePlan)

  return {
    fetchState,
    projects,
    activeProjectId: activeProject?.projectId,
    loading: fetchState.status === "idle",
    retry: load,
  }
}
