import { queryOptions } from "@tanstack/react-query"

import { getRosterSnapshot, listRosterSnapshots } from "./roster-snapshot.api"
import { rosterSnapshotKeys } from "./roster-snapshot.keys"

export const rosterSnapshotQueries = {
  all: rosterSnapshotKeys.all,
  list: () =>
    queryOptions({
      queryKey: rosterSnapshotKeys.list(),
      queryFn: ({ signal }) => listRosterSnapshots(signal),
    }),
  // A snapshot's roster never changes once taken.
  detail: (snapshotId: string) =>
    queryOptions({
      queryKey: rosterSnapshotKeys.detail(snapshotId),
      queryFn: ({ signal }) => getRosterSnapshot(snapshotId, signal),
      staleTime: Infinity,
    }),
}
