import type { ApiSchemas } from "@/shared/api"

import type { LegendaryEventPlan, WithRun } from "./plan.types"

// `GET /api/v1/legendary-event-plans` and `GET .../{eventId}/run-records` (companion API change
// add-legendary-event-master-table-and-history, design D1, D4, D5, D6). Read-only, so no `Dto`
// suffix (as in `plan.types.ts`). Wire shapes are generated from the API's OpenAPI document (spec:
// api-contract-sync); records only narrow `run`, checked by `toLegendaryEventRun`.
type S = ApiSchemas

/** `GET /legendary-event-plans`: every stored plan of the caller, ordered by `eventId`. */
export type LegendaryEventPlanList = { plans: LegendaryEventPlan[] }

/** One synced battle as a record keeps it: `objectivesCleared` uses the synced ids (0 defeat-all,
 *  k the objective with catalog `index` k - 1). The synced `encounterPoints` is not kept. */
export type LegendaryEventRunRecordEncounter =
  S["LegendaryEventRunRecordEncounterResponse"]

/** Each lane null (as synced) or its encounters in battle order. */
export type LegendaryEventRunRecordLanes =
  S["LegendaryEventRunRecordLanesResponse"]

/** A plan team as it was at the record's last progress; the depth is the one stored for the
 *  record's `run`, or null. */
export type LegendaryEventRunRecordTeam =
  S["LegendaryEventRunRecordTeamResponse"]

export type RosterSnapshotAbility = S["RosterAbilityResponse"]

/** One owned character as synced (the `characters` chunk record). */
export type RosterSnapshotCharacter = S["RosterCharacterResponse"]

/** One owned MoW as synced (the `mows` chunk record). */
export type RosterSnapshotMow = S["RosterMowResponse"]

/** `GET .../run-records/{recordId}/roster`: the whole owned roster as it was at the record's last
 *  progress, read on demand (records never carry it). */
export type RosterSnapshot = S["RosterSnapshotResponse"]

/** One run occurrence of an event, as of the last sync that changed its progress: `startedAt` the
 *  first sync that saw it, `progressAt` the last that changed its lanes, `points` the synced event
 *  points then; `teams` in lane then `sortOrder` order, empty when no team was planned. */
export type LegendaryEventRunRecord = WithRun<
  S["LegendaryEventRunRecordResponse"]
>

/** `GET /legendary-event-plans/{eventId}/run-records`: one page, newest `startedAt` first.
 *  `nextAfter` is the cursor of the next (older) page, null on the last one. */
export type LegendaryEventRunRecords = Omit<
  S["LegendaryEventRunRecordsResponse"],
  "records"
> & { records: LegendaryEventRunRecord[] }
