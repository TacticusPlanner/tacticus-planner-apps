import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/entities/goal-farming"
import type { HreShardSource } from "@/entities/hre-mission"

import { splitEstimateBlock } from "./hre-goal-source"

const daras: HreShardSource = {
  characterId: "astraDaras",
  status: "running",
  eventKey: "occ-daras",
  startUtc: "2026-11-20T00:00:00Z",
  endUtc: "2026-12-04T00:00:00Z",
}
const sources = new Map([[daras.characterId, daras]])

const blocked = (
  blockers: { resourceId: string; reason: "HreRunning" | "NoFarmLocation" }[],
  actionable: string[] = []
): EstimateOutcome => ({
  status: "Blocked",
  reason: blockers[0]?.reason ?? "NoFarmLocation",
  resourceIds: blockers.map((blocker) => blocker.resourceId as never),
  blockers: blockers.map((blocker) => ({
    resourceId: blocker.resourceId as never,
    reason: blocker.reason,
    remaining: 80,
  })),
  actionableResourceIds: actionable as never[],
})

describe("splitEstimateBlock", () => {
  it("is not blocked when every blocker comes from a Hero Release Event", () => {
    expect(
      splitEstimateBlock(
        blocked([{ resourceId: "shard:astraDaras", reason: "HreRunning" }]),
        sources
      )
    ).toEqual({ reason: undefined, partial: false, hreSource: daras })
  })

  it("keeps a real dead end as the reason alongside the HRE", () => {
    expect(
      splitEstimateBlock(
        blocked(
          [
            { resourceId: "upgHpM004", reason: "NoFarmLocation" },
            { resourceId: "shard:astraDaras", reason: "HreRunning" },
          ],
          ["upgA"]
        ),
        sources
      )
    ).toEqual({ reason: "NoFarmLocation", partial: true, hreSource: daras })
  })

  it("passes through ordinary blocks, goal-wide blocks and estimates", () => {
    expect(
      splitEstimateBlock(
        blocked([{ resourceId: "shard:astraDaras", reason: "NoFarmLocation" }]),
        sources
      )
    ).toEqual({ reason: "NoFarmLocation", partial: false, hreSource: null })
    expect(
      splitEstimateBlock(
        { status: "Blocked", reason: "SimulationLimit", resourceIds: [] },
        sources
      )
    ).toEqual({ reason: "SimulationLimit", partial: false, hreSource: null })
    expect(splitEstimateBlock(undefined, sources)).toEqual({
      reason: undefined,
      partial: false,
      hreSource: null,
    })
  })
})
