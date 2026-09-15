import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

let catalogState: unknown
let raidBossesState: unknown
let rosterState: unknown

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) =>
    querier.toString().includes("getRaidBosses")
      ? raidBossesState
      : querier.toString().includes("readOwnedRoster")
        ? rosterState
        : undefined,
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getRaidBosses: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: vi.fn(),
  getPlayerMows: vi.fn(),
}))
vi.mock("@/entities/guild-raid-meta", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/guild-raid-meta")>()
  return {
    ...actual,
    useGuildRaidMetaCatalog: () => catalogState,
  }
})

import { useGuildRaidInvestmentReadiness } from "./use-guild-raid-investment-readiness"

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
  }))
}

const bossUnitSetId = "Boss1"

const readyMeta = {
  status: "ready" as const,
  meta: {
    sourceId: "source",
    updatedOn: "2026-07-01",
    comps: [],
    bosses: [
      {
        bossUnitSetId,
        primeUnitSetIds: [],
        recommendations: [
          {
            id: "Boss1-meta",
            kind: "meta",
            heroSlots: heroSlots(["heroA", "heroB", "heroC", "heroD", "heroE"]),
            mowId: "mowX",
            mowReplacementIds: [],
            compIds: [],
            efficiency: 1,
          },
        ],
      },
    ],
    primes: [],
  },
  presentation: {} as never,
  retry: vi.fn(),
}

const catalogBoss = {
  unitSetId: bossUnitSetId,
  kind: "boss" as const,
  isPrimarch: false,
  factionId: "faction",
  movement: 3,
  statProgression: [
    {
      health: 1,
      damage: 1,
      fixedArmor: 1,
      rank: 0,
      starLevel: 0,
      baseRarity: "Common",
      progressionIndex: 5,
      abilityLevel: 1,
    },
  ],
}

describe("useGuildRaidInvestmentReadiness", () => {
  it("is unavailable while the catalog is still loading", () => {
    catalogState = { status: "loading" }
    raidBossesState = undefined
    rosterState = undefined

    const { result } = renderHook(() =>
      useGuildRaidInvestmentReadiness({
        bossUnitSetId,
        isObservationActive: true,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("is unavailable when the guild has no active observation, even with all data synced", () => {
    catalogState = readyMeta
    raidBossesState = { bosses: [catalogBoss], primes: [] }
    rosterState = { characters: [], mows: [] }

    const { result } = renderHook(() =>
      useGuildRaidInvestmentReadiness({
        bossUnitSetId,
        isObservationActive: false,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("is unavailable when the boss has no catalog raid-boss record", () => {
    catalogState = readyMeta
    raidBossesState = { bosses: [], primes: [] }
    rosterState = { characters: [], mows: [] }

    const { result } = renderHook(() =>
      useGuildRaidInvestmentReadiness({
        bossUnitSetId,
        isObservationActive: true,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("resolves a ready result keyed by recommendation id when every input is present", () => {
    catalogState = readyMeta
    raidBossesState = { bosses: [catalogBoss], primes: [] }
    rosterState = {
      characters: [
        {
          unitId: "heroA",
          xpLevel: 10,
          rank: "Gold1",
          progressionIndex: "Epic:RedOneStar",
          abilities: [{ level: 30 }, { level: 30 }],
        },
      ],
      mows: [],
    }

    const { result } = renderHook(() =>
      useGuildRaidInvestmentReadiness({
        bossUnitSetId,
        isObservationActive: true,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return
    const entry = result.current.byRecommendationId.get("Boss1-meta")
    expect(entry).toBeDefined()
    expect(entry!.heroSlots.map((slot) => slot.heroId)).toEqual([
      "heroA",
      "heroB",
      "heroC",
      "heroD",
      "heroE",
    ])
    // heroA is owned and invested; the other four are unowned — team readiness sits above 0.
    expect(entry!.teamReadiness).toBeGreaterThan(0)
  })
})
