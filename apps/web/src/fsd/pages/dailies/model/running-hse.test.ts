import { describe, expect, it } from "vitest"

import { hseDefinitionConfig } from "@/test/fixtures/home-screen-event-scoring"
import type { HseFixtureId } from "@/test/fixtures/home-screen-event-scoring"

import {
  hseStatBoostFor,
  runningHseFor,
  runningPersonalHses,
} from "./running-hse"

const instance = (
  definitionId: HseFixtureId,
  startUtc: string,
  status = "running",
  parameters: Record<string, unknown> | null = null
) => ({ status, entry: { definitionId, startUtc, parameters } })

const hses = (instances: ReturnType<typeof instance>[]) =>
  runningPersonalHses(
    instances,
    (id) => hseDefinitionConfig(id as HseFixtureId),
    (item) => `name:${item.entry.definitionId}`
  )

describe("runningPersonalHses", () => {
  it("keeps the personal event beside a Global one, whatever the order", () => {
    // Issue 12: Global Blood Tithe and Faction Boost: World Eaters ran together.
    const both = [
      instance("hse-global-operation-imperator", "2026-11-23T00:00:00Z"),
      instance("hse-faction-boost", "2026-11-23T00:00:00Z", "running", {
        targetFactionId: "DarkAngels",
      }),
    ]
    for (const order of [both, both.toReversed()]) {
      const running = hses(order)
      expect(running.map((hse) => hse.name)).toEqual(["name:hse-faction-boost"])
      const boost = running[0]
      expect(boost && hseStatBoostFor(boost, "arena")).toEqual({
        health: 20,
        damage: 20,
        armour: 20,
      })
      expect(boost && hseStatBoostFor(boost, "onslaught")).toBeNull()
      expect(runningHseFor(running, "arena")?.name).toBe(
        "name:hse-faction-boost"
      )
      // Faction Boost scores in Arena, Onslaught and Salvage Run only.
      expect(runningHseFor(running, "battle")).toBeNull()
      expect(runningHseFor(running, "guildRaid")).toBeNull()
    }
  })

  it("leaves out past and upcoming events, the latest start first", () => {
    const running = hses([
      instance("hse-trait-boost-psyker", "2026-11-20T00:00:00Z"),
      instance("hse-faction-boost", "2026-11-01T00:00:00Z", "past"),
      instance("hse-machine-hunt", "2026-11-22T00:00:00Z"),
    ])
    expect(running.map((hse) => hse.name)).toEqual([
      "name:hse-machine-hunt",
      "name:hse-trait-boost-psyker",
    ])
  })
})
