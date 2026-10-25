import { bench, describe } from "vitest"

import { LEGENDARY_EVENT_LANE_IDS } from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { createPlanEvaluator } from "./plan-evaluator"
import type { PlanInputs } from "./plan-inputs"
import { planInputs } from "./plan.fixtures"
import { recommendUpgrades, recommendUpgradesNow } from "./plan-upgrades"
import { SLICE_BUDGET_MS } from "./run-sliced"

// The audit's account: the fixture roster plus 60 more event units, every lane with battle powers.
const BATTLE_POWERS = [
  1018, 3055, 8199, 20_703, 40_586, 75_787, 134_603, 200_000, 300_000, 400_000,
  500_000, 650_000,
]

function benchInputs(): PlanInputs {
  const base = planInputs()
  const owned = new Set(base.roster.map((unit) => unit.unitId as string))
  const eventUnitIds = new Set(
    LEGENDARY_EVENT_LANE_IDS.flatMap(
      (laneId) => utharEvent[laneId].availableUnitIds as readonly string[]
    )
  )
  const extra = legendaryEventCharacters
    .filter((unit) => eventUnitIds.has(unit.id) && !owned.has(unit.id))
    .slice(0, 60)
    .map((unit) => ({ ...base.roster[0]!, unitId: unit.id }))
  return {
    ...base,
    roster: [...base.roster, ...extra],
    lanes: base.lanes.map((lane) => ({ ...lane, battlePowers: BATTLE_POWERS })),
  }
}

const inputs = benchInputs()
const economy = { runs: [], showPaidOptions: false }
const search = () => ({
  inputs,
  evaluator: createPlanEvaluator(inputs, economy),
  targetPoints: Number.POSITIVE_INFINITY,
  farmingDays: (_unitId: string, steps: readonly unknown[]) => steps.length * 5,
  alreadyPlanned: () => false,
  masterTotal: () => 0,
  hordeMultiplier: () => 1,
})

describe("plan upgrade search", () => {
  bench("whole search in one go", () => {
    recommendUpgradesNow(search())
  })

  // The longest slice is the budget plus the longest single step, since a slice checks its
  // deadline after each step.
  let longestStepMs = 0
  bench(
    "whole search step by step (longest step)",
    () => {
      const iterator = recommendUpgrades(search())
      for (;;) {
        const started = performance.now()
        const next = iterator.next()
        longestStepMs = Math.max(longestStepMs, performance.now() - started)
        if (next.done) break
      }
    },
    {
      teardown: () => {
        console.info(
          `longest step ${longestStepMs.toFixed(1)} ms, longest slice ≤ ${(SLICE_BUDGET_MS + longestStepMs).toFixed(1)} ms`
        )
      },
    }
  )
})
