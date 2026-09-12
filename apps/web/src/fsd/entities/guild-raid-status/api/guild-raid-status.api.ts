import { ApiError, apiGet, apiPost } from "@/shared/api"

// Mirrors the API's id-only GuildRaidStatusResponse family (TacticusPlanner.Api.Features.Guilds).

export type GuildRaidObservationState = "active" | "noActiveSeason"
export type GuildRaidFreshness = "fresh" | "stale"
// Serialized PascalCase: the backend enum has no camelCase naming policy applied, unlike
// GuildRaidFreshness/GuildRaidObservationState above.
export type GuildRaidDifficulty =
  "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic"

export type GuildRaidModifierStatus = {
  modifierId: string
  type: string
  target: string
  subtarget: string | null
  amount: number
  activationRemainingHp: number | null
  active: boolean | null
}

export type GuildRaidPrimeStatus = {
  encounterIndex: number
  unitSetId: string
  progressionIndex: number
  remainingHp: number | null
  maximumHp: number | null
  modifiers: GuildRaidModifierStatus[]
}

export type GuildRaidBossStatus = {
  unitSetId: string
  progressionIndex: number
  remainingHp: number
  maximumHp: number
  isUpcoming: boolean
}

export type GuildRaidSeasonStatus = {
  seasonNumber: number
  seasonConfigId: string
  endsAt: string | null
  tierIndex: number
  setIndex: number
  setCount: number
  difficulty: GuildRaidDifficulty
  boss: GuildRaidBossStatus
  primes: GuildRaidPrimeStatus[]
}

export type GuildRaidStatusResponse = {
  state: GuildRaidObservationState
  observedAt: string
  freshness: GuildRaidFreshness
  lastGuildSyncSucceededAt: string
  season: GuildRaidSeasonStatus | null
}

/**
 * The GET endpoint's outcome, including the API's "never observed" 409 conflict as a normal (non-error)
 * result — the page treats it as a distinct display state, not a request failure.
 */
export type GuildRaidStatusResult =
  | { kind: "observed"; status: GuildRaidStatusResponse }
  | { kind: "neverObserved" }

const statusPath = "/api/v1/guilds/me/raid-status"
const refreshPath = "/api/v1/guilds/me/raid-status/refresh"

/** Pure read — never triggers an upstream sync. See `refreshGuildRaidStatus` for the forced sync. */
export async function getGuildRaidStatus(
  signal?: AbortSignal
): Promise<GuildRaidStatusResult> {
  try {
    const status = await apiGet<GuildRaidStatusResponse>(statusPath, { signal })
    return { kind: "observed", status }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
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
  return apiPost<GuildRaidStatusResponse>(refreshPath, { signal })
}
