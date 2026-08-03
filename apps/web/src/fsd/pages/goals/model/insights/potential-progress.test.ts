import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"
import type { GoalInventoryAllocation } from "@/features/goal-farming"
import { computePotentialProgressRatio } from ".//potential-progress"

const detail = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero-1",
  goalType: "Rank",
  status: "Active",
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  projectIds: ["project-1"],
  dependsOn: [],
  events: [],
  snapshot: null,
  config: {
    rank: {
      start: 0,
      end: 4,
      startPointFive: false,
      endPointFive: false,
      startAppliedUpgrades: 0,
      endAppliedUpgrades: 0,
    },
  },
} as unknown as GoalDetail

const allocation: GoalInventoryAllocation = {
  goalId: "goal-1",
  stages: [
    {
      target: "2",
      needs: [{ id: "U1" as never, count: 4 }],
      remaining: [],
    },
    {
      target: "4",
      needs: [{ id: "U1" as never, count: 4 }],
      remaining: [{ id: "U1" as never, count: 2 }],
    },
  ],
}

describe("computePotentialProgressRatio", () => {
  it("advances through a completed stage and interpolates the first partial stage", () => {
    expect(
      computePotentialProgressRatio(
        detail,
        { kind: "Rank", current: "Stone1", target: "Iron2", ratio: 0 },
        allocation
      )
    ).toBe(0.75)
  })

  it("never falls below actual progress and clamps at one", () => {
    const progress = {
      kind: "Rank" as const,
      current: "Iron1" as const,
      target: "Iron2" as const,
      ratio: 0.9,
    }
    expect(
      computePotentialProgressRatio(detail, progress, allocation)
    ).toBeGreaterThanOrEqual(0.9)
    expect(
      computePotentialProgressRatio(detail, progress, {
        goalId: "goal-1",
        stages: [{ target: "final", needs: [], remaining: [] }],
      })
    ).toBe(1)
  })

  it("interpolates inventory for a same-rank partial target", () => {
    const partialDetail = {
      ...detail,
      config: {
        ...detail.config,
        rank: {
          ...detail.config.rank,
          start: 1,
          end: 1,
          endAppliedUpgrades: 2,
        },
      },
    } as GoalDetail
    expect(
      computePotentialProgressRatio(
        partialDetail,
        { kind: "Rank", current: "Stone2", target: "Stone2", ratio: 0.5 },
        {
          goalId: "goal-1",
          stages: [
            {
              target: "final",
              needs: [{ id: "U1" as never, count: 2 }],
              remaining: [{ id: "U1" as never, count: 1 }],
            },
          ],
        }
      )
    ).toBe(0.75)
  })

  it("returns null when actual progress is unknown", () => {
    expect(
      computePotentialProgressRatio(detail, { kind: "Unknown" }, allocation)
    ).toBeNull()
  })
})
