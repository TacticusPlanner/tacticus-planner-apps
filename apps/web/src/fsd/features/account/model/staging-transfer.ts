import type { AppEnvironment } from "@/shared/config"

/**
 * What the account dialog's Staging tab offers here: production mints a code ("export"), staging
 * redeems one ("import"). Nothing locally or while the `StagingTransfer` flag is off.
 */
export type StagingTransferMode = "export" | "import"

export function stagingTransferMode(
  environment: AppEnvironment,
  enabled: boolean
): StagingTransferMode | null {
  if (!enabled) return null
  if (environment === "production") return "export"
  if (environment === "staging") return "import"
  return null
}

/** Whole minutes left before `expiresAt` (ISO), never below zero. */
export function minutesUntil(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 60_000))
}
