import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"
import { DAY_MS } from "@/shared/lib"

/** The manage sheet's sections (design D3): manual snapshots with V1 imports, then automatic ones,
 *  each newest first as the list serves them. */
export function manageSections(list: PersonalRosterSnapshotList | undefined): {
  manual: PersonalRosterSnapshot[]
  auto: PersonalRosterSnapshot[]
} {
  const items = list?.items ?? []
  return {
    manual: items.filter((snapshot) => snapshot.source !== "auto"),
    auto: items.filter((snapshot) => snapshot.source === "auto"),
  }
}

/** Keeping an automatic snapshot needs room under the manual limit. */
export function canKeep(list: PersonalRosterSnapshotList | undefined): boolean {
  return list !== undefined && list.count < list.limit
}

/** The automatic-snapshot window (the API's `AutoWindowDays`): a sync takes one only when no
 *  roster snapshot of any kind, Legendary Event rosters included, is newer than this. */
const AUTO_SNAPSHOT_WINDOW_DAYS = 30

/** When the next automatic snapshot can be taken: with the next sync, or after a date. */
export type NextAutoSnapshot =
  { kind: "nextSync" } | { kind: "after"; atMs: number }

/**
 * The next automatic snapshot (automatic-roster-snapshots): the newest personal snapshot or
 * Legendary Event roster plus the window. Once that has passed, or with no roster at all, the
 * next sync takes one.
 */
export function nextAutoSnapshot(
  snapshots: readonly { takenAt: string }[],
  runRecords: readonly { progressAt: string }[],
  nowMs: number
): NextAutoSnapshot {
  const times = [
    ...snapshots.map((snapshot) => Date.parse(snapshot.takenAt)),
    ...runRecords.map((record) => Date.parse(record.progressAt)),
  ].filter((ms) => Number.isFinite(ms))
  if (times.length === 0) return { kind: "nextSync" }
  const atMs = Math.max(...times) + AUTO_SNAPSHOT_WINDOW_DAYS * DAY_MS
  return atMs > nowMs ? { kind: "after", atMs } : { kind: "nextSync" }
}

/** One read-only Legendary Event roster row of the manage sheet. */
export type ManageRunRecordRow = {
  id: string
  eventName: string
  run: number
  takenAt: string
}

/** The Legendary Event rosters, newest roster first, named from the catalog (else the event id). */
export function manageRunRecordRows(
  records: readonly {
    id: string
    eventId: string
    run: number
    progressAt: string
  }[],
  eventNames: ReadonlyMap<string, string>
): ManageRunRecordRow[] {
  return records
    .map((record) => ({
      id: record.id,
      eventName: eventNames.get(record.eventId) ?? record.eventId,
      run: record.run,
      takenAt: record.progressAt,
    }))
    .toSorted((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))
}
