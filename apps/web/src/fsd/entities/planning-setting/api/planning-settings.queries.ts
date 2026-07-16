import { queryOptions } from "@tanstack/react-query"

import { getPlanningSettings } from "./planning-settings.api"

export const planningSettingsQueries = {
  current: () =>
    queryOptions({
      queryKey: ["planning-settings"] as const,
      queryFn: ({ signal }) => getPlanningSettings(signal),
    }),
}
