import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { planningSettingsQueries } from "../api/planning-settings.queries"
import { updatePlanningSettings } from "../api/planning-settings.api"
import { defaultPlanningSettings, type PlanningSettingsUpdate } from "./types"

export function usePlanningSettings() {
  const isAuthenticated = useIsAuthenticated()
  const client = useQueryClient()
  const query = useQuery({
    ...planningSettingsQueries.current(),
    enabled: isAuthenticated,
  })
  const mutation = useMutation({
    mutationFn: updatePlanningSettings,
    onSuccess: (settings) => {
      client.setQueryData(planningSettingsQueries.current().queryKey, settings)
    },
  })

  return {
    settings: query.data ?? defaultPlanningSettings,
    loading: isAuthenticated && query.isPending,
    /** The stored settings failed to load, so `settings` holds defaults that must not be saved. */
    failed: query.isError,
    retry: () => void query.refetch(),
    save: async (settings: PlanningSettingsUpdate) => {
      await mutation.mutateAsync(settings)
    },
  }
}
