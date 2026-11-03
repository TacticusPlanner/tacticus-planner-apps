import type { ApiSchemas as S } from "@/shared/api"

/** A personal snapshot's metadata (`GET me/roster-snapshots`); the roster is read on demand. */
export type PersonalRosterSnapshot = S["PersonalRosterSnapshotResponse"]

/** The caller's personal snapshots, newest `takenAt` first, with the usage limit. */
export type PersonalRosterSnapshotList = S["PersonalRosterSnapshotListResponse"]

/** How a personal snapshot was taken. */
export type RosterSnapshotSource = S["RosterSnapshotSource"]

/** A stored roster: a personal snapshot's body or a Legendary Event run record's roster. */
export type RosterSnapshotBody = S["RosterSnapshotResponse"]

/** The issue codes the snapshot endpoints answer with on a 409. */
export const rosterSnapshotIssues = {
  limitReached: "rosterSnapshotLimitReached",
  notSynced: "playerDataNotSynced",
  notAutomatic: "rosterSnapshotNotAutomatic",
} as const
