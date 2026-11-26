import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import type { CraftedInventoryPool } from "@/entities/goal-farming"

import { buildUpgradeNeeds, createCraftedNeedTracker } from "./plan-item-needs"
import type { PlanUpgradeMaterial } from "./use-plan-insights.domain"

const crafted = upgradeIdSchema.parse("crafted")
const base = upgradeIdSchema.parse("base")

function pool(stock: number): CraftedInventoryPool {
  return Object.assign(new Map([[crafted, stock]]), {
    demand: new Map<typeof crafted, number>(),
  })
}

/** What a goal's need calculation does to the pool: ask for `asked`, take what the stock has. */
function spend(target: CraftedInventoryPool, asked: number) {
  target.demand?.set(crafted, (target.demand.get(crafted) ?? 0) + asked)
  const held = target.get(crafted) ?? 0
  target.set(crafted, held - Math.min(held, asked))
}

describe("createCraftedNeedTracker", () => {
  it("adds up each scoped goal's ask and what the stock left short, in priority order", () => {
    const shared = pool(3)
    const tracker = createCraftedNeedTracker(shared)
    tracker.begin()
    spend(shared, 2)
    tracker.end("first", true)
    tracker.begin()
    spend(shared, 4)
    tracker.end("second", true)

    expect(tracker.needs().get(crafted)).toEqual({
      need: 6,
      short: 3,
      goalIds: ["first", "second"],
    })
  })

  it("leaves out a goal outside the scope, though it still spends the stock", () => {
    const shared = pool(2)
    const tracker = createCraftedNeedTracker(shared)
    tracker.begin()
    spend(shared, 2)
    tracker.end("other", false)
    tracker.begin()
    spend(shared, 1)
    tracker.end("mine", true)

    expect(tracker.needs().get(crafted)).toEqual({
      need: 1,
      short: 1,
      goalIds: ["mine"],
    })
  })
})

describe("buildUpgradeNeeds", () => {
  it("reads base materials from Insights' Required and Missing beside the crafted needs", () => {
    const material = {
      id: base,
      required: 10,
      missing: 4,
      goalIds: ["g"],
    } as PlanUpgradeMaterial
    const needs = buildUpgradeNeeds(
      [material],
      new Map([[crafted, { need: 1, short: 0, goalIds: ["g"] }]])
    )

    expect(needs.get(base)).toEqual({ need: 10, short: 4, goalIds: ["g"] })
    expect(needs.get(crafted)).toEqual({ need: 1, short: 0, goalIds: ["g"] })
  })
})
