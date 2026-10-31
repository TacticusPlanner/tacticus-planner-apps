import { useIsAuthenticated } from "@azure/msal-react"
import { useQuery } from "@tanstack/react-query"

import {
  battleProgressQueries,
  type BattleProgressOverride,
} from "@/entities/player-data-override"
import { useFeatureFlag } from "@/shared/feature-flags"

/**
 * The player's saved battle progress overrides while manual battles are on and they're signed in,
 * else undefined (also while loading or after a failed load).
 */
export function useSavedBattleProgress():
  readonly BattleProgressOverride[] | undefined {
  const isAuthenticated = useIsAuthenticated()
  const enabled = useFeatureFlag("ManualBattles") && isAuthenticated
  const query = useQuery({ ...battleProgressQueries.current(), enabled })
  return enabled ? query.data?.battles : undefined
}
