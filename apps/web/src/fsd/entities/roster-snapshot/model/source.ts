/**
 * A roster a comparison can start or end at (design D4): the current synced roster, a personal
 * snapshot, or a Legendary Event run record's roster. Serialized for the URL as `current`, the
 * snapshot id, or `le:<eventId>:<recordId>`.
 */
export type RosterSourceId =
  | { kind: "current" }
  | { kind: "snapshot"; snapshotId: string }
  | { kind: "runRecord"; eventId: string; recordId: string }

const CURRENT = "current"
const RUN_RECORD_PREFIX = "le"

export function formatRosterSourceId(source: RosterSourceId): string {
  switch (source.kind) {
    case "current": {
      return CURRENT
    }
    case "snapshot": {
      return source.snapshotId
    }
    case "runRecord": {
      return `${RUN_RECORD_PREFIX}:${source.eventId}:${source.recordId}`
    }
  }
}

/** The source a URL value names, or null when it is not one (an id is checked against the listed
 *  sources by the caller). */
export function parseRosterSourceId(value: string): RosterSourceId | null {
  if (value === CURRENT) return { kind: "current" }
  const parts = value.split(":")
  if (parts[0] === RUN_RECORD_PREFIX) {
    const [, eventId, recordId] = parts
    return parts.length === 3 && eventId && recordId
      ? { kind: "runRecord", eventId, recordId }
      : null
  }
  return value.length > 0 && parts.length === 1
    ? { kind: "snapshot", snapshotId: value }
    : null
}
