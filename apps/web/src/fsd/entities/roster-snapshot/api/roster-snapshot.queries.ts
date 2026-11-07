import { queryOptions } from "@tanstack/react-query"

import { getRosterSnapshot, listRosterSnapshots } from "./roster-snapshot.api"

export const rosterSnapshotQueries = {
  all: () => ["roster-snapshots"] as const,
  list: () =>
    queryOptions({
      queryKey: [...rosterSnapshotQueries.all(), { scope: "list" }] as const,
      queryFn: ({ signal }) => listRosterSnapshots(signal),
    }),
  // A snapshot's roster never changes once taken.
  detail: (snapshotId: string) =>
    queryOptions({
      queryKey: [...rosterSnapshotQueries.all(), snapshotId] as const,
      queryFn: ({ signal }) => getRosterSnapshot(snapshotId, signal),
      staleTime: Infinity,
    }),
}
