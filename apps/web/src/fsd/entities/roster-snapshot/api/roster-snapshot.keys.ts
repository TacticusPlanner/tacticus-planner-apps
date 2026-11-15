/**
 * The roster snapshot query keys, apart from their fetchers so the startup graph can invalidate
 * them (after a player-data sync) without loading the snapshot API.
 */
export const rosterSnapshotKeys = {
  all: () => ["roster-snapshots"] as const,
  list: () => [...rosterSnapshotKeys.all(), { scope: "list" }] as const,
  detail: (snapshotId: string) =>
    [...rosterSnapshotKeys.all(), snapshotId] as const,
}
