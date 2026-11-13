import { ApiError } from "@/shared/api"
import type { AppEnvironment } from "@/shared/config"

/**
 * What the account dialog's Transfer tab offers here: production mints a code ("export"), staging
 * redeems one ("import"). Nothing locally.
 */
export type StagingTransferMode = "export" | "import"

export function stagingTransferMode(
  environment: AppEnvironment
): StagingTransferMode | null {
  if (environment === "production") return "export"
  if (environment === "staging") return "import"
  return null
}

/** Whole minutes left before `expiresAt` (ISO), never below zero. */
export function minutesUntil(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 60_000))
}

/**
 * The trace id to show with a failure, so the tester can quote it: only a server-side failure carries a
 * message that points at it ("Use the traceId when contacting support"); a refused code says what to fix.
 */
export function supportTraceId(error: unknown): string | undefined {
  return error instanceof ApiError && error.status >= 500
    ? error.traceId
    : undefined
}
