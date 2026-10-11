import { describe, expect, it } from "vitest"

import type {
  ClearEstimateConfigState,
  LegendaryEventBattle,
  LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { buildClearEstimates } from "./legendary-event-page.view-model"

const config: ClearEstimateConfigState = {
  status: "ready",
  config: { powerRatio: 0.5, calibrated: true, coefficients: new Map() },
}
// Every lane battle at power 1,000: a 0.5 ratio makes each threshold 500.
const battles = (["alpha", "beta", "gamma"] as const).flatMap((laneId) =>
  lysanderEvent[laneId].battleIds.map((id) => ({ id, power: 1000 }))
) as LegendaryEventBattle[]
const roster = [
  {
    unitId: "bloodDante",
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
    appliedUpgradeSlots: [0, 1, 2],
    abilities: [
      { abilityId: "a", level: 20 },
      { abilityId: "p", level: 15 },
    ],
  },
] as unknown as LegendaryEventRosterUnit[]

const build = (
  overrides: Partial<Parameters<typeof buildClearEstimates>[0]> = {}
) =>
  buildClearEstimates({
    event: lysanderEvent,
    config,
    battles,
    roster,
    ...overrides,
  })

describe("buildClearEstimates", () => {
  it("estimates owned units and teams per lane", () => {
    const result = build()
    if (result.kind !== "ready") throw new Error("not ready")
    const alpha = result.byLane.alpha
    expect(alpha.unit("bloodDante")?.depth).toBe(
      lysanderEvent.alpha.battleIds.length
    )
    expect(alpha.unit("ultraCalgar")).toBeNull()
    expect(alpha.team(["bloodDante", "ultraCalgar"])?.depth).toBe(
      lysanderEvent.alpha.battleIds.length
    )
    expect(alpha.team(["ultraCalgar"])).toBeNull()
  })

  it("is hidden when the dataset is absent or failed, or the battles failed", () => {
    expect(build({ config: { status: "absent" } }).kind).toBe("hidden")
    expect(build({ config: { status: "failed", retry: () => {} } }).kind).toBe(
      "hidden"
    )
    expect(build({ battles: "error" }).kind).toBe("hidden")
  })

  it("is pending while the dataset, the battles or the roster load", () => {
    expect(build({ config: { status: "loading" } }).kind).toBe("pending")
    expect(build({ battles: "loading" }).kind).toBe("pending")
    expect(build({ roster: "loading" }).kind).toBe("pending")
  })

  it("estimates nothing when the roster could not be read", () => {
    for (const unavailable of ["error", undefined] as const) {
      const result = build({ roster: unavailable })
      if (result.kind !== "ready") throw new Error("not ready")
      expect(result.byLane.alpha.unit("bloodDante")).toBeNull()
      expect(result.byLane.alpha.team(["bloodDante"])).toBeNull()
    }
  })

  it("estimates nothing on a lane whose battles are missing", () => {
    const result = build({ battles: [] })
    if (result.kind !== "ready") throw new Error("not ready")
    expect(result.byLane.alpha.unit("bloodDante")).toBeNull()
  })
})
