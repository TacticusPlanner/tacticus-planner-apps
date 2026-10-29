import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiIssue } from "@/shared/api"

import { planningSettingsQueries } from "../api/planning-settings.queries"
import { updatePlanningSettings } from "../api/planning-settings.api"
import {
  defaultPlanningSettings,
  normalizeGoalsView,
  type GoalsView,
  type PlanningSettings,
} from "./types"

/**
 * The account's stored Goals view (goal-list-layout: Cards by default, follows the account). A toggle
 * writes the cache first and saves in the background; a revision conflict is merged onto the
 * conflict's current settings and retried once, so another device's energy/rarity change survives.
 * Any other failure restores the previous view and shows a toast.
 */
export function useGoalsView() {
  const isAuthenticated = useIsAuthenticated()
  const client = useQueryClient()
  const { t } = useTranslation()
  const { queryKey } = planningSettingsQueries.current()
  const query = useQuery({
    ...planningSettingsQueries.current(),
    enabled: isAuthenticated,
  })

  const mutation = useMutation({
    mutationFn: async (next: GoalsView) => {
      const current =
        client.getQueryData<PlanningSettings>(queryKey) ??
        defaultPlanningSettings
      try {
        return await updatePlanningSettings({ ...current, goalsView: next })
      } catch (error) {
        const conflict = apiIssue(error, "concurrency")
        if (!conflict || !isPlanningSettings(conflict.current)) throw error
        const merged = { ...conflict.current, goalsView: next }
        client.setQueryData(queryKey, merged)
        return await updatePlanningSettings(merged)
      }
    },
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey })
      const previous = client.getQueryData<PlanningSettings>(queryKey)
      client.setQueryData(queryKey, {
        ...(previous ?? defaultPlanningSettings),
        goalsView: next,
      })
      return { previous }
    },
    onError: (_error, _next, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous)
      else client.removeQueries({ queryKey, exact: true })
      toast.error(t("goals.view.saveError"))
    },
    onSuccess: (settings) => {
      client.setQueryData(queryKey, settings)
    },
  })

  return {
    view: normalizeGoalsView(query.data?.goalsView),
    loading: isAuthenticated && query.isPending,
    setView: (next: GoalsView) => {
      if (!isAuthenticated) return
      mutation.mutate(next)
    },
  }
}

function isPlanningSettings(value: unknown): value is PlanningSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PlanningSettings).revision === "number" &&
    typeof (value as PlanningSettings).dailyEnergy === "number"
  )
}
