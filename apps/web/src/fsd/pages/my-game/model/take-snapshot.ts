import { rosterSnapshotIssues } from "@/entities/roster-snapshot"
import { ApiError, apiIssue } from "@/shared/api"

/** The longest snapshot name the API accepts (after trimming). */
const SNAPSHOT_NAME_MAX = 60

/** Why a typed name cannot be saved; null when it can (blank uses the date). */
export function snapshotNameError(name: string): { max: number } | null {
  return name.trim().length > SNAPSHOT_NAME_MAX
    ? { max: SNAPSHOT_NAME_MAX }
    : null
}

/** A required rename: not blank and at most the maximum length. */
export function isValidSnapshotRename(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= SNAPSHOT_NAME_MAX
}

export type TakeFailure =
  | { kind: "limitReached"; canFallBack: false }
  | { kind: "notSynced"; canFallBack: false }
  | { kind: "rateLimited"; canFallBack: true; retryAfterSeconds?: number }
  /** The sync failed (Tacticus unavailable, rejected key, network). */
  | { kind: "syncFailed"; canFallBack: true }

/** How the take dialog presents a failed `POST me/roster-snapshots`. */
export function takeFailure(error: unknown): TakeFailure {
  if (apiIssue(error, rosterSnapshotIssues.limitReached)) {
    return { kind: "limitReached", canFallBack: false }
  }
  if (apiIssue(error, rosterSnapshotIssues.notSynced)) {
    return { kind: "notSynced", canFallBack: false }
  }
  if (error instanceof ApiError && error.status === 429) {
    return {
      kind: "rateLimited",
      canFallBack: true,
      retryAfterSeconds: error.retryAfterSeconds,
    }
  }
  return { kind: "syncFailed", canFallBack: true }
}
