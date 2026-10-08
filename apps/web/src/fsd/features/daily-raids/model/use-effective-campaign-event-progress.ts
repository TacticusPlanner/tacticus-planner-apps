import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLiveQuery } from "dexie-react-hooks"
import { getCampaignEventProgress } from "@workspace/player-data/queries"

import {
  buildEffectiveCampaignEventProgress,
  campaignEventProgressQueries,
} from "@/entities/player-data-override"

// Split out of use-daily-raids.ts to keep it under this repo's max-lines rule.

/**
 * Event-campaign progress for raid eligibility: the player's manual overrides from the Progress
 * page merged over synced `campaign-events-progress` (daily-raids-today, "Only the active campaign
 * event is farmable"). `ready` waits for synced progress and, when signed in, for the override load
 * to settle; a failed load falls back to synced-only and is reported through `isError`, which
 * Daily Raids treats as an error while lighter consumers (Home) keep the synced view.
 */
export function useEffectiveCampaignEventProgress(isAuthenticated: boolean) {
  const synced = useLiveQuery(
    async () => ({ value: await getCampaignEventProgress() }),
    []
  )
  const overridesQuery = useQuery({
    ...campaignEventProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const byKey = useMemo(
    () =>
      buildEffectiveCampaignEventProgress(
        synced?.value ?? [],
        overridesQuery.data?.progress ?? []
      ),
    [synced, overridesQuery.data]
  )
  return {
    byKey,
    ready:
      Boolean(synced) &&
      (!isAuthenticated || overridesQuery.isSuccess || overridesQuery.isError),
    isError: overridesQuery.isError,
  }
}
