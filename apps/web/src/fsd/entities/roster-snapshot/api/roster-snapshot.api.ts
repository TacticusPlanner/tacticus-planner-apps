import { apiClient, unwrap } from "@/shared/api"

import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
  RosterSnapshotBody,
} from "../model/types"

/** The caller's personal snapshots, newest first, with the limit and count. */
export function listRosterSnapshots(
  signal?: AbortSignal
): Promise<PersonalRosterSnapshotList> {
  return unwrap(apiClient().GET("/api/v1/me/roster-snapshots", { signal }))
}

/** One snapshot's roster; immutable once taken. */
export function getRosterSnapshot(
  snapshotId: string,
  signal?: AbortSignal
): Promise<RosterSnapshotBody> {
  return unwrap(
    apiClient().GET("/api/v1/me/roster-snapshots/{snapshotId}", {
      params: { path: { snapshotId } },
      signal,
    })
  )
}

/** Takes a snapshot: after a fresh sync, or from the stored roster when `fromLastSync`. A blank
 *  name uses the date. 409 `rosterSnapshotLimitReached` at the limit, 409 `playerDataNotSynced`
 *  when `fromLastSync` and nothing was synced; upstream failures as the sync answers them. */
export function createRosterSnapshot(request: {
  name?: string
  fromLastSync?: boolean
}): Promise<PersonalRosterSnapshot> {
  return unwrap(
    apiClient().POST("/api/v1/me/roster-snapshots", {
      params: {
        query: request.fromLastSync ? { fromLastSync: true } : undefined,
      },
      body: { name: request.name?.trim() || null },
    })
  )
}

export function renameRosterSnapshot(
  snapshotId: string,
  name: string
): Promise<PersonalRosterSnapshot> {
  return unwrap(
    apiClient().PATCH("/api/v1/me/roster-snapshots/{snapshotId}", {
      params: { path: { snapshotId } },
      body: { name: name.trim() },
    })
  )
}

/** Permanently deletes a snapshot. */
export function deleteRosterSnapshot(snapshotId: string) {
  return unwrap(
    apiClient().DELETE("/api/v1/me/roster-snapshots/{snapshotId}", {
      params: { path: { snapshotId } },
    })
  )
}
