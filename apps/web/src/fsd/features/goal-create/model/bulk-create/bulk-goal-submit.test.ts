import { describe, expect, it, vi } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import type { CreateCombinedGoalsRequest } from "@/entities/goal"

import type { BulkUnitPlan } from "./bulk-goal-plan"
import {
  bulkCreateRequest,
  sendBulkPlans,
  type BulkUnitStatus,
} from "./bulk-goal-submit"

function plan(
  kind: "character" | "mow",
  unitId: string,
  specCount: number
): BulkUnitPlan {
  return {
    unit: {
      kind,
      unitId: unitId as UnitId,
      name: unitId,
      owned: false,
      startProgression: "Common:None",
    },
    goals: [],
    skipped: [],
    specs: Array.from({ length: specCount }, () => ({
      goalType: "Unlock",
    })) as BulkUnitPlan["specs"],
  }
}

describe("bulkCreateRequest", () => {
  it("targets the unit and the chosen project", () => {
    const request = bulkCreateRequest(plan("mow", "galatian", 1), "p1")
    expect(request.entityType).toBe("Mow")
    expect(request.entityId).toBe("galatian")
    expect(request.projects).toEqual([{ projectId: "p1" }])
    expect(request.goals).toHaveLength(1)
  })

  it("leaves projects null without a project (Default)", () => {
    const request = bulkCreateRequest(plan("character", "ragnar", 1), undefined)
    expect(request.entityType).toBe("Character")
    expect(request.projects).toBeNull()
  })
})

describe("sendBulkPlans", () => {
  it("sends units with goals in order, continuing past a failure", async () => {
    const order: string[] = []
    const send = vi.fn(async (request: CreateCombinedGoalsRequest) => {
      order.push(request.entityId)
      if (request.entityId === "b") throw new Error("boom")
    })
    const statuses = new Map<string, BulkUnitStatus>()
    const result = await sendBulkPlans({
      plans: [
        plan("character", "a", 1),
        plan("character", "skip", 0),
        plan("character", "b", 2),
        plan("mow", "c", 1),
      ],
      projectId: undefined,
      send,
      describeError: (error) => (error as Error).message,
      onStatus: (key, status) => statuses.set(key, status),
    })
    expect(order).toEqual(["a", "b", "c"])
    expect(result.failed).toBe(1)
    expect(result.sent.map((p) => p.unit.unitId)).toEqual(["a", "b", "c"])
    expect(statuses.get("character:a")).toEqual({ status: "done" })
    expect(statuses.get("character:b")).toEqual({
      status: "failed",
      error: "boom",
    })
    expect(statuses.get("mow:c")).toEqual({ status: "done" })
    expect(statuses.has("character:skip")).toBe(false)
  })

  it("with only, sends just those units", async () => {
    const send = vi.fn(async () => {})
    const result = await sendBulkPlans({
      plans: [plan("character", "a", 1), plan("character", "b", 1)],
      projectId: "p1",
      only: new Set(["character:b"]),
      send,
      describeError: () => "",
      onStatus: () => {},
    })
    expect(send).toHaveBeenCalledTimes(1)
    expect(result.sent.map((p) => p.unit.unitId)).toEqual(["b"])
    expect(result.failed).toBe(0)
  })
})
