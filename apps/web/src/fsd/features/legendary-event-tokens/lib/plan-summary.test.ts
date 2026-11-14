import { describe, expect, it } from "vitest"

import { planSummary } from "./plan-summary"
import type { TokenPlanView } from "./token-plan-view"

const marker = (steps: string[] = []) => ({ milestones: [], steps })

const view = (markers: ReturnType<typeof marker>[]) =>
  ({
    kind: "ready",
    forecast: {
      runs: [
        { run: 1, state: "done", supply: { total: 0 } },
        { run: 2, state: "now", supply: { total: 3 } },
        { run: 3, state: "planned", supply: { total: 10 } },
      ],
      markers,
    },
    byRun: {
      sections: [
        { run: 2, start: 0, count: 3 },
        { run: 3, start: 3, count: 10 },
      ],
      overflow: null,
    },
  }) as unknown as TokenPlanView

describe("planSummary", () => {
  it("names the current run's tokens and the token that reaches the next step", () => {
    expect(
      planSummary(
        view([marker(), marker(), marker(), marker(), marker(["unlock"])])
      )
    ).toEqual({
      tokensLeft: 3,
      nextStep: { step: "unlock", token: 5, run: 3 },
    })
  })

  it("has no step when no planned token reaches one", () => {
    expect(planSummary(view([marker(), marker()]))?.nextStep).toBeNull()
  })

  it("is null without a ready plan", () => {
    expect(planSummary({ kind: "loading" })).toBeNull()
  })
})
