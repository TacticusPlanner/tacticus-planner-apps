import { describe, expect, it } from "vitest"

import type { ProjectGoalSummary } from "@/entities/project"

import {
  activeProjectMembers,
  availableCampaignBattles,
  calculateDailyRaids,
} from "./daily-raids-calc"

function member(status: string, priority: number): ProjectGoalSummary {
  return {
    priority,
    goal: {
      goalId: `${status}-${priority}`,
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status,
      notes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  }
}

describe("daily raid derivation", () => {
  it("includes only the active campaign event alongside standing campaigns", () => {
    const battles = [
      { id: "standing", campaignGroupId: "Octarius" },
      { id: "active", campaignGroupId: "eventCampaign7" },
      { id: "inactive", campaignGroupId: "eventCampaign6" },
    ]
    const eventIds = new Set(["eventCampaign6", "eventCampaign7"])

    expect(
      availableCampaignBattles(battles, eventIds, "eventCampaign7").map(
        (battle) => battle.id
      )
    ).toEqual(["standing", "active"])
    expect(
      availableCampaignBattles(battles, eventIds, null).map(
        (battle) => battle.id
      )
    ).toEqual(["standing"])
  })

  it("keeps only Active members and preserves project priority order", () => {
    const result = activeProjectMembers([
      member("Paused", 0),
      member("Active", 8),
      member("Completed", 1),
      member("Archived", 2),
      member("Active", 3),
    ])

    expect(result.map((entry) => entry.priority)).toEqual([3, 8])
    expect(result.every((entry) => entry.goal.status === "Active")).toBe(true)
  })

  it("returns no farmable plan when the selected project has no Active goals", () => {
    expect(
      calculateDailyRaids({
        members: [member("Paused", 1), member("Completed", 2)],
        details: [],
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
        inventoryUpgrades: [],
        upgradesById: new Map(),
        battlesById: new Map(),
        charactersById: new Map(),
        mowsById: new Map(),
        ascensionCostsById: new Map(),
        unlockShardCostsById: new Map(),
        getCharacter: () => undefined,
        dailyEnergy: 288,
      })
    ).toBeNull()
  })
})
