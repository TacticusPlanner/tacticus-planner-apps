import {
  describeModifier,
  type ModifierDescription,
  type RaidBossEncounterModifier,
} from "@/entities/raid-boss"
import type {
  GuildRaidDifficulty,
  GuildRaidFreshness,
  GuildRaidModifierStatus,
  GuildRaidStatusResult,
} from "@/entities/guild-raid-status"

import {
  resourceCountdown,
  seasonEndCountdown,
  type GuildRaidCountdown,
} from "./guild-raid-countdowns"

export type GuildRaidModifierView = {
  modifierId: string
  description: ModifierDescription
  activation:
    | { kind: "known"; remainingHp: number; active: boolean }
    | { kind: "unknown" }
}

export type GuildRaidPrimeView = {
  encounterIndex: number
  unitSetId: string
  name: string
  portraitSrc?: string
  hp:
    { kind: "known"; remaining: number; max: number } | { kind: "unavailable" }
  modifiers: GuildRaidModifierView[]
}

type GuildRaidBossView = {
  unitSetId: string
  name: string
  portraitSrc?: string
  remainingHp: number
  maximumHp: number
  isUpcoming: boolean
}

export type GuildRaidSeasonView = {
  seasonNumber: number
  /** 1-based, for display — the API's `tierIndex` is 0-based. */
  tierNumber: number
  /** 1-based, for display — the API's `setIndex` is 0-based. */
  setNumber: number
  setCount: number
  difficulty: GuildRaidDifficulty
  boss: GuildRaidBossView
  primes: GuildRaidPrimeView[]
  endsAt: GuildRaidCountdown
}

export type GuildRaidStatusView =
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "neverObserved" }
  | {
      kind: "noActiveSeason"
      freshness: GuildRaidFreshness
      observedAtMs: number
      lastGuildSyncSucceededAtMs: number
    }
  | {
      kind: "active"
      freshness: GuildRaidFreshness
      observedAtMs: number
      lastGuildSyncSucceededAtMs: number
      season: GuildRaidSeasonView
      catalogWarning: boolean
    }

export type GuildRaidResourceView = {
  current: number
  max: number
  countdown: GuildRaidCountdown
}

export type GuildRaidResourcesView =
  | { kind: "unavailable" }
  | {
      kind: "available"
      observedAtMs: number
      tokens: GuildRaidResourceView
      bombs: GuildRaidResourceView
    }

export type GuildRaidsViewModel = {
  status: GuildRaidStatusView
  resources: GuildRaidResourcesView
  refresh: () => void
  isRefreshing: boolean
  hasRefreshError: boolean
}

export type GuildRaidTokenBucket = {
  current: number
  max: number
  nextTokenInSeconds: number
}

export type GuildRaidCatalogResolver = {
  resolveName: (unitSetId: string) => string
  hasName: (unitSetId: string) => boolean
  resolvePortrait: (unitSetId: string) => string | undefined
}

function toModifierView(
  modifier: GuildRaidModifierStatus
): GuildRaidModifierView {
  // `describeModifier` only reads type/target/subtarget/amount; `hpLost` is unused by it but required
  // by RaidBossEncounterModifier's shape (the encounter-schedule field this status payload doesn't carry).
  const adapted: RaidBossEncounterModifier = {
    hpLost: 0,
    modifierId: modifier.modifierId,
    type: modifier.type,
    target: modifier.target,
    subtarget: modifier.subtarget ?? undefined,
    amount: modifier.amount,
  }

  return {
    modifierId: modifier.modifierId,
    description: describeModifier(adapted),
    activation:
      modifier.activationRemainingHp !== null && modifier.active !== null
        ? {
            kind: "known",
            remainingHp: modifier.activationRemainingHp,
            active: modifier.active,
          }
        : { kind: "unknown" },
  }
}

function resolveDisplay(catalog: GuildRaidCatalogResolver, unitSetId: string) {
  return {
    name: catalog.resolveName(unitSetId),
    portraitSrc: catalog.resolvePortrait(unitSetId),
    known: catalog.hasName(unitSetId),
  }
}

export function buildGuildRaidStatusView(params: {
  query: GuildRaidStatusResult | undefined
  isLoading: boolean
  isError: boolean
  retry: () => void
  catalog: GuildRaidCatalogResolver
  nowMs: number
}): GuildRaidStatusView {
  const { query, isLoading, isError, retry, catalog, nowMs } = params

  // A background refetch failure sets `isError` but TanStack Query retains the last-loaded `query.data`
  // (see useGuildRaidStatus) — only fall back to the hard-error view when there's no retained data to show.
  if (isError && !query) {
    return { kind: "error", retry }
  }
  if (isLoading || !query) {
    return { kind: "loading" }
  }
  if (query.kind === "neverObserved") {
    return { kind: "neverObserved" }
  }

  const { status } = query
  const observedAtMs = Date.parse(status.observedAt)
  const lastGuildSyncSucceededAtMs = Date.parse(status.lastGuildSyncSucceededAt)

  if (status.state === "noActiveSeason" || !status.season) {
    return {
      kind: "noActiveSeason",
      freshness: status.freshness,
      observedAtMs,
      lastGuildSyncSucceededAtMs,
    }
  }

  const season = status.season
  const boss = resolveDisplay(catalog, season.boss.unitSetId)
  const primeDisplays = season.primes.map((prime) =>
    resolveDisplay(catalog, prime.unitSetId)
  )
  const catalogWarning =
    !boss.known || primeDisplays.some((display) => !display.known)

  return {
    kind: "active",
    freshness: status.freshness,
    observedAtMs,
    lastGuildSyncSucceededAtMs,
    catalogWarning,
    season: {
      seasonNumber: season.seasonNumber,
      tierNumber: season.tierIndex + 1,
      setNumber: season.setIndex + 1,
      setCount: season.setCount,
      difficulty: season.difficulty,
      endsAt: seasonEndCountdown(season.endsAt, nowMs),
      boss: {
        unitSetId: season.boss.unitSetId,
        name: boss.name,
        portraitSrc: boss.portraitSrc,
        remainingHp: season.boss.remainingHp,
        maximumHp: season.boss.maximumHp,
        isUpcoming: season.boss.isUpcoming,
      },
      primes: season.primes.map((prime, index) => ({
        encounterIndex: prime.encounterIndex,
        unitSetId: prime.unitSetId,
        name: primeDisplays[index]!.name,
        portraitSrc: primeDisplays[index]!.portraitSrc,
        hp:
          prime.remainingHp !== null && prime.maximumHp !== null
            ? {
                kind: "known",
                remaining: prime.remainingHp,
                max: prime.maximumHp,
              }
            : { kind: "unavailable" },
        modifiers: prime.modifiers.map(toModifierView),
      })),
    },
  }
}

export function buildGuildRaidResourcesView(params: {
  guildRaidTokens: {
    tokens: GuildRaidTokenBucket
    bombTokens: GuildRaidTokenBucket
  } | null
  observedAtMs: number | undefined
  nowMs: number
}): GuildRaidResourcesView {
  const { guildRaidTokens, observedAtMs, nowMs } = params

  if (!guildRaidTokens || observedAtMs === undefined) {
    return { kind: "unavailable" }
  }

  return {
    kind: "available",
    observedAtMs,
    tokens: {
      current: guildRaidTokens.tokens.current,
      max: guildRaidTokens.tokens.max,
      countdown: resourceCountdown(guildRaidTokens.tokens, observedAtMs, nowMs),
    },
    bombs: {
      current: guildRaidTokens.bombTokens.current,
      max: guildRaidTokens.bombTokens.max,
      countdown: resourceCountdown(
        guildRaidTokens.bombTokens,
        observedAtMs,
        nowMs
      ),
    },
  }
}
