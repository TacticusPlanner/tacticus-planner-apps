import type { QueryClient } from "@tanstack/react-query"

import { accountQueries } from "../api/account.queries"
import type { TacticusIntegrationResult } from "../api/account.api"
import type { CurrentUser } from "./current-user"

/**
 * Writes a Tacticus integration update into the cached current user, so the configured-key and
 * user-id state follow the response without another `GET /me` (spec: client-data-freshness).
 */
export function applyTacticusIntegrationResult(
  queryClient: QueryClient,
  result: TacticusIntegrationResult
) {
  queryClient.setQueryData<CurrentUser>(
    accountQueries.current().queryKey,
    (user) =>
      user && {
        ...user,
        hasCompletedOnboarding: result.tacticusApiKeyConfigured,
        tacticusApiKeyMasked: result.tacticusApiKeyMasked,
        tacticusUserIdMasked: result.tacticusUserIdMasked,
      }
  )
}
