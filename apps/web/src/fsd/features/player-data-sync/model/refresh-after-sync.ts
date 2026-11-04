import type { QueryClient } from "@tanstack/react-query"

import { goalQueries } from "@/entities/goal"
import { legendaryEventPlanQueries } from "@/entities/legendary-event"
import { rosterSnapshotKeys } from "@/entities/roster-snapshot"

/**
 * The server reads a completed player-data sync can change: goals, every event's Legendary Event
 * run records (a sync can create or update a run's record), the plan list and the personal roster
 * snapshot list (a sync can take an automatic snapshot). Called once a sync
 * has finished successfully, so the refetches see what it wrote.
 */
export async function refreshServerReadsAfterSync(
  queryClient: QueryClient
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
    queryClient.invalidateQueries({
      queryKey: legendaryEventPlanQueries.runRecordsAll(),
    }),
    queryClient.invalidateQueries({
      queryKey: legendaryEventPlanQueries.list().queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: rosterSnapshotKeys.list(),
    }),
  ])
}
