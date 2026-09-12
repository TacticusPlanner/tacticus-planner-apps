import { describe, expect, it, vi } from "vitest"

import type {
  GuildRaidModifierStatus,
  GuildRaidStatusResponse,
  GuildRaidStatusResult,
} from "@/entities/guild-raid-status"

import {
  buildGuildRaidResourcesView,
  buildGuildRaidStatusView,
  type GuildRaidCatalogResolver,
} from "./guild-raid-status-view-model"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

const knownCatalog: GuildRaidCatalogResolver = {
  resolveName: (id) => `Name(${id})`,
  hasName: () => true,
  resolvePortrait: (id) => `portrait/${id}`,
}

const unknownCatalog: GuildRaidCatalogResolver = {
  resolveName: (id) => `Fallback(${id})`,
  hasName: () => false,
  resolvePortrait: () => undefined,
}

function modifier(
  overrides: Partial<GuildRaidModifierStatus> = {}
): GuildRaidModifierStatus {
  return {
    modifierId: "mod-1",
    type: "bossStatPctDecrease",
    target: "damage",
    subtarget: null,
    amount: 15,
    activationRemainingHp: 500,
    active: false,
    ...overrides,
  }
}

function defaultSeason(): NonNullable<GuildRaidStatusResponse["season"]> {
  return {
    seasonNumber: 12,
    seasonConfigId: "guild_boss_season_config_1",
    endsAt: null,
    tierIndex: 2,
    setIndex: 1,
    setCount: 3,
    difficulty: "Epic",
    boss: {
      unitSetId: "GuildBoss4Boss1OrksGhazghkull",
      progressionIndex: 5,
      remainingHp: 1000,
      maximumHp: 5000,
      isUpcoming: false,
    },
    primes: [
      {
        encounterIndex: 1,
        unitSetId: "GuildBoss4MiniBoss1OrksBigMek",
        progressionIndex: 5,
        remainingHp: 200,
        maximumHp: 800,
        modifiers: [modifier()],
      },
    ],
  }
}

function activeStatus(
  overrides: Partial<GuildRaidStatusResponse> = {}
): GuildRaidStatusResponse {
  return {
    state: "active",
    observedAt: new Date(NOW).toISOString(),
    freshness: "fresh",
    lastGuildSyncSucceededAt: new Date(NOW).toISOString(),
    season: defaultSeason(),
    ...overrides,
  }
}

describe("buildGuildRaidStatusView", () => {
  it("is loading while the query is in flight", () => {
    expect(
      buildGuildRaidStatusView({
        query: undefined,
        isLoading: true,
        isError: false,
        retry: vi.fn(),
        catalog: knownCatalog,
        nowMs: NOW,
      })
    ).toEqual({ kind: "loading" })
  })

  it("is an error state carrying the retry action when the request failed", () => {
    const retry = vi.fn()
    const result = buildGuildRaidStatusView({
      query: undefined,
      isLoading: false,
      isError: true,
      retry,
      catalog: knownCatalog,
      nowMs: NOW,
    })
    expect(result).toEqual({ kind: "error", retry })
  })

  it("keeps showing retained status when a background refetch fails", () => {
    const status = activeStatus()
    const result = buildGuildRaidStatusView({
      query: { kind: "observed", status },
      isLoading: false,
      isError: true,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })
    expect(result.kind).toBe("active")
  })

  it("is neverObserved for the API's never-observed conflict", () => {
    const result: GuildRaidStatusResult = { kind: "neverObserved" }
    expect(
      buildGuildRaidStatusView({
        query: result,
        isLoading: false,
        isError: false,
        retry: vi.fn(),
        catalog: knownCatalog,
        nowMs: NOW,
      })
    ).toEqual({ kind: "neverObserved" })
  })

  it("maps a no-active-season response while preserving freshness/observation timestamps", () => {
    const status = activeStatus({
      state: "noActiveSeason",
      season: null,
      freshness: "stale",
    })
    const result = buildGuildRaidStatusView({
      query: { kind: "observed", status },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })
    expect(result).toEqual({
      kind: "noActiveSeason",
      freshness: "stale",
      observedAtMs: Date.parse(status.observedAt),
      lastGuildSyncSucceededAtMs: Date.parse(status.lastGuildSyncSucceededAt),
    })
  })

  it("resolves boss/prime names and portraits from the catalog resolver and reports no warning when known", () => {
    const status = activeStatus()
    const result = buildGuildRaidStatusView({
      query: { kind: "observed", status },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })
    expect(result.kind).toBe("active")
    if (result.kind !== "active") return
    expect(result.catalogWarning).toBe(false)
    expect(result.season.boss.name).toBe("Name(GuildBoss4Boss1OrksGhazghkull)")
    expect(result.season.boss.portraitSrc).toBe(
      "portrait/GuildBoss4Boss1OrksGhazghkull"
    )
    expect(result.season.primes[0]!.name).toBe(
      "Name(GuildBoss4MiniBoss1OrksBigMek)"
    )
    expect(result.season.tierNumber).toBe(3)
    expect(result.season.setNumber).toBe(2)
  })

  it("flags a catalog warning and falls back to readable names when an id is unknown locally", () => {
    const status = activeStatus()
    const result = buildGuildRaidStatusView({
      query: { kind: "observed", status },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: unknownCatalog,
      nowMs: NOW,
    })
    expect(result.kind).toBe("active")
    if (result.kind !== "active") return
    expect(result.catalogWarning).toBe(true)
    expect(result.season.boss.name).toBe(
      "Fallback(GuildBoss4Boss1OrksGhazghkull)"
    )
    expect(result.season.boss.portraitSrc).toBeUndefined()
  })

  it("marks prime HP and modifier activation unavailable/unknown when null", () => {
    const status = activeStatus({
      season: {
        ...defaultSeason(),
        primes: [
          {
            encounterIndex: 1,
            unitSetId: "GuildBoss4MiniBoss1OrksBigMek",
            progressionIndex: 5,
            remainingHp: null,
            maximumHp: null,
            modifiers: [
              modifier({ activationRemainingHp: null, active: null }),
            ],
          },
        ],
      },
    })
    const result = buildGuildRaidStatusView({
      query: { kind: "observed", status },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })
    expect(result.kind).toBe("active")
    if (result.kind !== "active") return
    expect(result.season.primes[0]!.hp).toEqual({ kind: "unavailable" })
    expect(result.season.primes[0]!.modifiers[0]!.activation).toEqual({
      kind: "unknown",
    })
  })

  it("reports a known season end as a pending countdown and a null endsAt as unavailable", () => {
    const knownEndsAt = activeStatus({
      season: {
        ...defaultSeason(),
        endsAt: new Date(NOW + 3_600_000).toISOString(),
      },
    })
    const unknownEndsAt = activeStatus({
      season: { ...defaultSeason(), endsAt: null },
    })

    const known = buildGuildRaidStatusView({
      query: { kind: "observed", status: knownEndsAt },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })
    const unknown = buildGuildRaidStatusView({
      query: { kind: "observed", status: unknownEndsAt },
      isLoading: false,
      isError: false,
      retry: vi.fn(),
      catalog: knownCatalog,
      nowMs: NOW,
    })

    expect(known.kind === "active" ? known.season.endsAt : null).toEqual({
      kind: "pending",
      targetMs: NOW + 3_600_000,
    })
    expect(unknown.kind === "active" ? unknown.season.endsAt : null).toEqual({
      kind: "unavailable",
    })
  })
})

describe("buildGuildRaidResourcesView", () => {
  it("is unavailable when the player has no synced Guild Raid token record", () => {
    expect(
      buildGuildRaidResourcesView({
        guildRaidTokens: null,
        observedAtMs: NOW,
        nowMs: NOW,
      })
    ).toEqual({ kind: "unavailable" })
  })

  it("is unavailable when the observation time is missing even if tokens are present", () => {
    expect(
      buildGuildRaidResourcesView({
        guildRaidTokens: {
          tokens: { current: 1, max: 5, nextTokenInSeconds: 100 },
          bombTokens: { current: 5, max: 5, nextTokenInSeconds: 0 },
        },
        observedAtMs: undefined,
        nowMs: NOW,
      })
    ).toEqual({ kind: "unavailable" })
  })

  it("maps both buckets independently, including a full bucket alongside a counting one", () => {
    const result = buildGuildRaidResourcesView({
      guildRaidTokens: {
        tokens: { current: 2, max: 5, nextTokenInSeconds: 300 },
        bombTokens: { current: 5, max: 5, nextTokenInSeconds: 0 },
      },
      observedAtMs: NOW,
      nowMs: NOW,
    })
    expect(result).toEqual({
      kind: "available",
      observedAtMs: NOW,
      tokens: {
        current: 2,
        max: 5,
        countdown: { kind: "pending", targetMs: NOW + 300_000 },
      },
      bombs: { current: 5, max: 5, countdown: { kind: "full" } },
    })
  })
})
