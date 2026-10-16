import type { Progression } from "@workspace/game-domain"

import {
  previousRunTeamClears,
  recordHistory,
  selectRunRecords,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycleState,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventRunRecord,
  type ReadState,
  type RunHistory,
} from "@/entities/legendary-event"

import type { ReadValue } from "../legendary-event-page.view-model"

/** An event occurrence has three runs ("Run N of 3"). */
export const RUN_COUNT = 3

/**
 * The Last run card's state (spec: run history data states): `hidden` when there is nothing to
 * show (signed out, or an active event whose only record is the current run), `loading` while the
 * records, the synced progress or the roster load, `error` when the records read failed,
 * `noRecords` for the one-line note, and `ready` with the previous run's history and, on archived
 * or upcoming events only, the earlier runs' histories (newest first).
 */
export type LastRunViewModel =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "noRecords" }
  | { kind: "ready"; previous: RunHistory; earlier: RunHistory[] }

export interface LastRunInput {
  /** Signed in: the records are read only then. */
  enabled: boolean
  records: ReadState<LegendaryEventRunRecord[]>
  lifecycle: LegendaryEventLifecycleState
  progress: ReadValue<LegendaryEventProgress | undefined>
  roster: ReadValue<LegendaryEventRosterUnit[] | undefined>
  event: Pick<LegendaryEvent, LegendaryEventLaneId>
}

export function buildLastRunViewModel({
  enabled,
  records,
  lifecycle,
  progress,
  roster,
  event,
}: LastRunInput): LastRunViewModel {
  if (!enabled) return { kind: "hidden" }
  if (records.status === "error") {
    return { kind: "error", retry: records.retry }
  }
  if (
    records.status === "loading" ||
    progress === "loading" ||
    roster === "loading"
  ) {
    return { kind: "loading" }
  }
  if (records.data.length === 0) return { kind: "noRecords" }
  const selection = selectRunRecords(
    records.data,
    lifecycle,
    progress === "error" ? undefined : progress
  )
  if (!selection.previous) return { kind: "hidden" }
  const currentRoster = roster === "error" ? undefined : roster
  return {
    kind: "ready",
    previous: recordHistory(selection.previous, event, currentRoster),
    earlier:
      lifecycle === "active"
        ? []
        : selection.earlier.map((record) =>
            recordHistory(record, event, currentRoster)
          ),
  }
}

/** Each previous-run team's cleared battle, by team id with its lane; undefined while the records
 *  or the synced progress load, when the records read failed, or when signed out (no line). */
export type LastRunClears =
  | ReadonlyMap<string, { laneId: LegendaryEventLaneId; clearedBattle: number }>
  | undefined

export function buildLastRunClears({
  enabled,
  records,
  lifecycle,
  progress,
}: Pick<
  LastRunInput,
  "enabled" | "records" | "lifecycle" | "progress"
>): LastRunClears {
  if (!enabled || records.status !== "ready" || progress === "loading") {
    return undefined
  }
  const { previous } = selectRunRecords(
    records.data,
    lifecycle,
    progress === "error" ? undefined : progress
  )
  return previousRunTeamClears(previous)
}

/** The team card's last-run figure: only for a team with the same id on the same lane. */
export function teamLastRunClearedBattle(
  clears: LastRunClears,
  teamId: string,
  laneId: LegendaryEventLaneId
): number | undefined {
  const entry = clears?.get(teamId)
  return entry?.laneId === laneId ? entry.clearedBattle : undefined
}

/** The deltas count the analytics event reports (0 when there is no list). */
export function historyDeltaCount(history: RunHistory): number {
  return history.deltas.kind === "ready" ? history.deltas.deltas.length : 0
}

type ProgressionStars<P> = P extends `${string}:${infer Stars}` ? Stars : never

/** The `progression:stars.*` key of a "Rarity:Stars" progression, e.g. "RedFiveStars". */
export function progressionStarsKey(
  progression: Progression
): ProgressionStars<Progression> {
  return progression.slice(
    progression.indexOf(":") + 1
  ) as ProgressionStars<Progression>
}
