import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import type { GoalRow } from "../shared/types"
import { useSeasonFit } from "./use-season-fit"

const definitions = [
  {
    id: "battle-pass",
    type: "BattlePass",
    recurrence: {
      kind: "Fixed",
      intervalDays: 35,
      durationDays: 34,
      anchorUtc: "2026-08-02T00:00:00Z",
    },
    requiredParameters: [],
    config: { seasonNumberAtAnchor: 40 },
  },
  {
    id: "guild-war-season",
    type: "GuildWarSeason",
    recurrence: {
      kind: "Fixed",
      intervalDays: 35,
      durationDays: 15,
      anchorUtc: "2026-08-15T00:00:00Z",
    },
    requiredParameters: [],
    config: { seasonNumberAtAnchor: 26 },
  },
]

const guildWarS28 = {
  occurrenceId: "occ-2026-10-24-guild-war-season-28",
  definitionId: "guild-war-season",
  confirmed: true,
  startUtc: "2026-10-24T00:00:00Z",
  endUtc: "2026-11-08T00:00:00Z",
  parameters: { season: 28 },
}

const rows: GoalRow[] = [
  {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    updatedAt: "2026-07-15T00:00:00Z",
  },
]
const estimates = new Map([
  ["goal-1", { days: 20, date: "2026-11-15", energyTotal: 0, raidsTotal: 0 }],
])
const reached = new Map<string, boolean>()

describe("useSeasonFit", () => {
  beforeEach(async () => {
    await seedGameCatalog({
      "event-definitions": definitions,
      "events-calendar": { "2026-10-24": [guildWarS28] },
    })
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("loads, then reports which seasons the catalog can place", async () => {
    const { result } = renderHook(() =>
      useSeasonFit("off", rows, estimates, reached)
    )
    expect(result.current.status).toBe("loading")

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      available: { battlePass: true, guildRaid: false, guildWar: true },
      active: null,
    })
  })

  it("fits goals against the chosen season", async () => {
    const { result } = renderHook(() =>
      useSeasonFit("guildWar", rows, estimates, reached)
    )

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("not ready")
    expect(result.current.active).toMatchObject({
      season: "guildWar",
      seasonNumber: 28,
      deadlineMs: Date.parse("2026-11-28T00:00:00Z"),
    })
    expect(result.current.active?.fits.get("goal-1")).toEqual({
      offset: 0,
      date: "2026-11-15",
    })
  })

  it("has no active fit for a mode the catalog cannot place", async () => {
    const { result } = renderHook(() =>
      useSeasonFit("guildRaid", rows, estimates, reached)
    )

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({ active: null })
  })
})
