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
