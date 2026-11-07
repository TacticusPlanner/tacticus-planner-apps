import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createRosterSnapshot,
  deleteRosterSnapshot,
  renameRosterSnapshot,
} from "../api/roster-snapshot.api"
import { rosterSnapshotQueries } from "../api/roster-snapshot.queries"

/** The caller's personal snapshots; `enabled` false (a guest) never requests them. */
export function useRosterSnapshots(enabled = true) {
  return useQuery({ ...rosterSnapshotQueries.list(), enabled })
}

/** Takes a snapshot and refreshes the list. */
export function useCreateRosterSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRosterSnapshot,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: rosterSnapshotQueries.list().queryKey,
      }),
  })
}

export function useRenameRosterSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ snapshotId, name }: { snapshotId: string; name: string }) =>
      renameRosterSnapshot(snapshotId, name),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: rosterSnapshotQueries.list().queryKey,
      }),
  })
}

/** Deletes a snapshot, dropping its cached roster and refreshing the list. */
export function useDeleteRosterSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (snapshotId: string) => deleteRosterSnapshot(snapshotId),
    onSuccess: (_data, snapshotId) => {
      queryClient.removeQueries({
        queryKey: rosterSnapshotQueries.detail(snapshotId).queryKey,
      })
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: rosterSnapshotQueries.list().queryKey,
      }),
  })
}
