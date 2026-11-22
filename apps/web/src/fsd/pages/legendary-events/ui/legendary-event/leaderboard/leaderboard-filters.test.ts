import { describe, expect, it, vi } from "vitest"

import {
  clearLeaderboardFilters,
  leaderboardActiveFilterCount,
} from "./leaderboard-filters"

describe("leaderboardActiveFilterCount", () => {
  const base = {
    onlyUnlocked: false,
    onlyInTeams: false,
    teamUnitIds: undefined,
    selectedObjectives: new Set<string>(),
  }

  it("counts each objective and the switches that can apply", () => {
    expect(
      leaderboardActiveFilterCount(
        {
          ...base,
          onlyUnlocked: true,
          onlyInTeams: true,
          teamUnitIds: { alpha: new Set(), beta: new Set(), gamma: new Set() },
          selectedObjectives: new Set(["a", "b"]),
        },
        true
      )
    ).toBe(4)
  })

  it("ignores a switch that cannot apply yet", () => {
    expect(
      leaderboardActiveFilterCount(
        { ...base, onlyUnlocked: true, onlyInTeams: true },
        false
      )
    ).toBe(0)
  })
})

describe("clearLeaderboardFilters", () => {
  it("turns both switches off and drops every objective", () => {
    const state = {
      onOnlyUnlockedChange: vi.fn(),
      onOnlyInTeamsChange: vi.fn(),
      onSelectedObjectivesChange: vi.fn(),
    }
    clearLeaderboardFilters(state)
    expect(state.onOnlyUnlockedChange).toHaveBeenCalledWith(false)
    expect(state.onOnlyInTeamsChange).toHaveBeenCalledWith(false)
    expect(state.onSelectedObjectivesChange).toHaveBeenCalledWith(new Set())
  })
})
