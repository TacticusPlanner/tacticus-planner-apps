import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "../model/estimate.domain"
import {
  hreShardReasons,
  relabelHreBlockers,
  relabelHreOutcomes,
} from "./hre-blockers"

const reasons = hreShardReasons([
  { characterId: "astraDaras", status: "running" },
  { characterId: "tauKariyan", status: "upcoming" },
])

const blocked = (
  blockers: {
    resourceId: string
    reason: "NoFarmLocation" | "InsufficientDailyEnergy"
  }[]
): EstimateOutcome => ({
  status: "Blocked",
  reason: blockers[0]?.reason ?? "NoFarmLocation",
  resourceIds: blockers.map((blocker) => blocker.resourceId as never),
  blockers: blockers.map((blocker) => ({
    resourceId: blocker.resourceId as never,
    reason: blocker.reason,
    remaining: 80,
  })),
  actionableResourceIds: [],
})

describe("hreShardReasons", () => {
  it("keys each featured hero's shard id by event status", () => {
    expect([...reasons]).toEqual([
      ["shard:astraDaras", "HreRunning"],
      ["shard:tauKariyan", "HreUpcoming"],
    ])
  })
})

describe("relabelHreBlockers", () => {
  it("relabels a featured hero's unfarmable shards with the event's reason", () => {
    const outcome = relabelHreBlockers(
      blocked([{ resourceId: "shard:astraDaras", reason: "NoFarmLocation" }]),
      reasons
    )
    expect(outcome).toMatchObject({
      status: "Blocked",
      reason: "HreRunning",
      blockers: [{ resourceId: "shard:astraDaras", reason: "HreRunning" }],
    })
  })

  it("puts a real dead end first so the outcome's reason names it", () => {
    const outcome = relabelHreBlockers(
      blocked([
        { resourceId: "shard:tauKariyan", reason: "NoFarmLocation" },
        { resourceId: "upgHpM004", reason: "NoFarmLocation" },
      ]),
      reasons
    )
    expect(outcome.status === "Blocked" && outcome.reason).toBe(
      "NoFarmLocation"
    )
    expect(
      outcome.status === "Blocked" &&
        outcome.blockers?.map((blocker) => blocker.reason)
    ).toEqual(["NoFarmLocation", "HreUpcoming"])
    expect(outcome.status === "Blocked" && outcome.resourceIds).toEqual([
      "upgHpM004",
      "shard:tauKariyan",
    ])
  })

  it("leaves other heroes, other reasons and estimated outcomes alone", () => {
    const other = blocked([
      { resourceId: "shard:orksWeirdboy", reason: "NoFarmLocation" },
      { resourceId: "shard:astraDaras", reason: "InsufficientDailyEnergy" },
    ])
    expect(relabelHreBlockers(other, reasons)).toBe(other)
    const estimated: EstimateOutcome = {
      status: "Estimated",
      days: 3,
      date: "2026-11-25",
      energyTotal: 100,
      raidsTotal: 10,
    }
    expect(relabelHreBlockers(estimated, reasons)).toBe(estimated)
  })
})

describe("relabelHreOutcomes", () => {
  it("returns the same map when no HRE is known", () => {
    const outcomes = new Map([
      [
        "g1",
        blocked([{ resourceId: "shard:astraDaras", reason: "NoFarmLocation" }]),
      ],
    ])
    expect(relabelHreOutcomes(outcomes, new Map())).toBe(outcomes)
    expect(relabelHreOutcomes(outcomes, reasons).get("g1")).toMatchObject({
      reason: "HreRunning",
    })
  })
})
