import { describe, expect, it } from "vitest"

import type {
  ClearEstimateConfigState,
  LegendaryEventBattle,
  LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import { buildClearEstimates } from "./legendary-event-page.view-model"

const config: ClearEstimateConfigState = {
  status: "ready",
  config: {
    powerRatio: 1.2,
    calibrated: true,
    hordeMultipliers: new Map(),
    unitPower: unitPowerContextFixture(),
  },
}
// Every lane battle at power 1,000: a 1.2 ratio makes each threshold 1,200, which Calgar (power
// 21,675) clears alone.
const battles = (["alpha", "beta", "gamma"] as const).flatMap((laneId) =>
  lysanderEvent[laneId].battleIds.map((id) => ({ id, power: 1000 }))
) as LegendaryEventBattle[]
const roster = [
  {
    unitId: "ultraCalgar",
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
    expect(alpha.unit("ultraCalgar")?.depth).toBe(
      lysanderEvent.alpha.battleIds.length
    )
    expect(alpha.unit("ultraTitus")).toBeNull()
    expect(alpha.team(["ultraCalgar", "ultraTitus"])?.depth).toBe(
      lysanderEvent.alpha.battleIds.length
    )
    expect(alpha.team(["ultraTitus"])).toBeNull()
    expect(alpha.inputs?.config.unitPower).not.toBeNull()
  })

  it("is hidden when the tier-list read or the battles failed", () => {
    expect(
      build({
        config: { status: "failed", retry: () => {}, missing: ["unitPower"] },
      }).kind
    ).toBe("hidden")
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
      expect(result.byLane.alpha.unit("ultraCalgar")).toBeNull()
      expect(result.byLane.alpha.team(["ultraCalgar"])).toBeNull()
    }
  })

  it("estimates nothing on a lane whose battles are missing", () => {
    const result = build({ battles: [] })
    if (result.kind !== "ready") throw new Error("not ready")
    expect(result.byLane.alpha.unit("ultraCalgar")).toBeNull()
  })

  it("estimates nothing, with no inputs, when power data is unavailable", () => {
    if (config.status !== "ready") throw new Error("not ready")
    const result = build({
      config: {
        status: "ready",
        config: { ...config.config, unitPower: null },
      },
    })
    if (result.kind !== "ready") throw new Error("not ready")
    for (const laneId of ["alpha", "beta", "gamma"] as const) {
      expect(result.byLane[laneId].unit("ultraCalgar")).toBeNull()
      expect(result.byLane[laneId].team(["ultraCalgar"])).toBeNull()
      expect(result.byLane[laneId].inputs).toBeUndefined()
    }
  })
})
