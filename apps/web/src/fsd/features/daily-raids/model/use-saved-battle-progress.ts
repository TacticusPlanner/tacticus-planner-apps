import { useIsAuthenticated } from "@azure/msal-react"
import { useQuery } from "@tanstack/react-query"

import {
  battleProgressQueries,
  type BattleProgressOverride,
} from "@/entities/player-data-override"

/**
 * The player's saved battle progress overrides while they're signed in, else undefined (also while
 * loading or after a failed load).
 */
export function useSavedBattleProgress():
  readonly BattleProgressOverride[] | undefined {
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...battleProgressQueries.current(),
    enabled: isAuthenticated,
  })
  return isAuthenticated ? query.data?.battles : undefined
}
