import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useActiveAccountId } from "@/shared/auth"

import { planningSettingsQueries } from "../api/planning-settings.queries"
import { updatePlanningSettings } from "../api/planning-settings.api"
import { defaultPlanningSettings, type PlanningSettings } from "./types"

export function usePlanningSettings() {
  const accountId = useActiveAccountId()
  const client = useQueryClient()
  const query = useQuery({
    ...planningSettingsQueries.current(accountId ?? "anonymous"),
    enabled: Boolean(accountId),
  })
  const mutation = useMutation({
    mutationFn: updatePlanningSettings,
    onSuccess: (settings) => {
      if (accountId) {
        client.setQueryData(
          planningSettingsQueries.current(accountId).queryKey,
          settings
        )
      }
    },
  })

  return {
    settings: query.data ?? defaultPlanningSettings,
    loading: Boolean(accountId) && query.isPending,
    save: async (settings: PlanningSettings) => {
      await mutation.mutateAsync(settings)
    },
  }
}
