import { ApiError, apiClient, unwrap, type ApiSchemas } from "@/shared/api"

// Wire shapes, generated from the API's OpenAPI document (spec: api-contract-sync); never hand-written.
type S = ApiSchemas

export type GuildRaidObservationState = S["GuildRaidObservationState"]
export type GuildRaidFreshness = S["GuildRaidFreshness"]
/** Serialized PascalCase, unlike the camelCase freshness and observation state. */
export type GuildRaidDifficulty = S["GuildRaidDifficulty"]
export type GuildRaidModifierStatus = S["GuildRaidModifierStatusResponse"]
export type GuildRaidPrimeStatus = S["GuildRaidPrimeStatusResponse"]
export type GuildRaidBossStatus = S["GuildRaidBossStatusResponse"]
export type GuildRaidSeasonStatus = S["GuildRaidSeasonStatusResponse"]
export type GuildRaidStatusResponse = S["GuildRaidStatusResponse"]

/**
 * The GET endpoint's outcome, including the API's "never observed" 409 conflict as a normal (non-error)
 * result — the page treats it as a distinct display state, not a request failure.
 */
export type GuildRaidStatusResult =
  | { kind: "observed"; status: GuildRaidStatusResponse }
  | { kind: "neverObserved" }

// GetMyGuildRaidStatusEndpoint's exact message for its one "no observation yet" 409 (distinct from the
// other 409 reasons ReadyGuildResolver reports — unregistered guild, never synchronized, no stored token —
// which mean the guild isn't ready rather than that it's syncing for the first time).
const neverObservedMessage =
  "The linked guild has no Guild Raid status observation yet."

/** Pure read — never triggers an upstream sync. See `refreshGuildRaidStatus` for the forced sync. */
export async function getGuildRaidStatus(
  signal?: AbortSignal
): Promise<GuildRaidStatusResult> {
  try {
    const status = await unwrap(
      apiClient().GET("/api/v1/guild/raid-status", { signal })
    )
    return { kind: "observed", status }
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      error.message === neverObservedMessage
    ) {
      return { kind: "neverObserved" }
    }
    throw error
  }
}

/**
 * Forces an upstream sync, subject to the API's own one-minute cooldown. A request inside the cooldown
 * still resolves with 200 and the current persisted result, so every 200 response here is a normal
 * success from the caller's point of view; only a rejected credential (502) or no retained data with an
 * unavailable upstream (503) reject this promise.
 */
export function refreshGuildRaidStatus(
  signal?: AbortSignal
): Promise<GuildRaidStatusResponse> {
  return unwrap(
    apiClient().POST("/api/v1/guild/raid-status/refresh", { signal })
  )
}
