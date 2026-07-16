import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { getPlanningSettings } from "./planning-settings.api"

export const planningSettingsQueries = {
  current: (accountId: string) =>
    queryOptions({
      queryKey: [
        ...authenticatedQueryKey(accountId),
        "planning-settings",
      ] as const,
      queryFn: ({ signal }) => getPlanningSettings(signal),
    }),
}
