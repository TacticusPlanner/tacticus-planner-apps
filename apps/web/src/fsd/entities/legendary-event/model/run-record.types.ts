import type { Progression, Rank } from "@workspace/game-domain"

import type {
  LegendaryEventDepthSource,
  LegendaryEventPlan,
  LegendaryEventRun,
} from "./plan.types"
import type { LegendaryEventLaneId } from "./types"

// Hand-written types for `GET /api/v1/me/legendary-event-plans` and
// `GET /api/v1/me/legendary-event-plans/{eventId}/run-records` (companion API change
// add-legendary-event-master-table-and-history, design D1, D4, D5, D6). Both are read-only and
// read as-is, so they carry no `Dto` suffix (as in `plan.types.ts`).

/** `GET /me/legendary-event-plans`: every stored plan of the caller, ordered by `eventId`. */
export interface LegendaryEventPlanList {
  plans: LegendaryEventPlan[]
}

/** One synced battle as a record keeps it: `objectivesCleared` uses the synced ids (0 defeat-all,
 *  k the objective with catalog `index` k − 1). The synced `encounterPoints` is not kept. */
export interface LegendaryEventRunRecordEncounter {
  objectivesCleared: number[]
  highScore: number
}

/** Each lane null (as synced) or its encounters in battle order. */
export type LegendaryEventRunRecordLanes = Record<
  LegendaryEventLaneId,
  LegendaryEventRunRecordEncounter[] | null
>

/** A plan team as it was at the record's last progress; the depth is the one stored for the
 *  record's `run`, or null. */
export interface LegendaryEventRunRecordTeam {
  teamId: string
  laneId: LegendaryEventLaneId
  name: string
  sortOrder: number
  memberUnitIds: string[]
  reserveUnitId: string | null
  objectiveIndexes: number[]
  expectedBattleClears: number | null
  expectedBattleClearsSource: LegendaryEventDepthSource | null
}

export interface RosterSnapshotAbility {
  abilityId: string
  level: number
}

/** One owned character as synced (the `characters` chunk record). */
export interface RosterSnapshotCharacter {
  unitId: string
  progressionIndex: Progression
  rank: Rank
  xpLevel: number
  shards: number
  mythicShards: number
  abilities: RosterSnapshotAbility[]
  appliedUpgradeSlots: number[]
  equippedItems: { slotId: string; equipmentId: string; level: number }[]
}

/** One owned MoW as synced (the `mows` chunk record). */
export interface RosterSnapshotMow {
  unitId: string
  progressionIndex: Progression
  xpLevel: number
  shards: number
  mythicShards: number
  abilities: RosterSnapshotAbility[]
  appliedUpgradeSlots: number[]
}

/** A whole owned roster at one moment (the API's general `roster_snapshots` row); kept generic so
 *  the later roster snapshots port reads the same shape. */
export interface RosterSnapshot {
  id: string
  /** ISO 8601 UTC. */
  takenAt: string
  catalogVersion: string
  characters: RosterSnapshotCharacter[]
  mows: RosterSnapshotMow[]
}

/** One run occurrence of an event, as of the last sync that changed its progress. */
export interface LegendaryEventRunRecord {
  id: string
  run: LegendaryEventRun
  /** ISO 8601 UTC: the first sync that saw this occurrence. */
  startedAt: string
  /** ISO 8601 UTC: the last sync that changed its lanes. */
  progressAt: string
  catalogVersion: string
  /** The synced event points at `progressAt`. */
  points: number
  lanes: LegendaryEventRunRecordLanes
  /** Lane then `sortOrder` order; empty when no team was planned. */
  teams: LegendaryEventRunRecordTeam[]
  /** Null when the snapshot has been removed. */
  rosterSnapshot: RosterSnapshot | null
}

/** `GET /me/legendary-event-plans/{eventId}/run-records`: newest `startedAt` first. */
export interface LegendaryEventRunRecords {
  eventId: string
  records: LegendaryEventRunRecord[]
}
