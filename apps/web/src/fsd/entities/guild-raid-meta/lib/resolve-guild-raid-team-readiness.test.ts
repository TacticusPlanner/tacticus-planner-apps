import { describe, expect, it } from "vitest"

import { resolveGuildRaidTeamReadiness } from "./resolve-guild-raid-team-readiness"

function fullyReadySlots(
  overrides: { index: number; readiness: number }[] = []
) {
  const base = [true, true, false, false, false].map((essential) => ({
    readiness: 100,
    essential,
  }))
  for (const { index, readiness } of overrides) {
    base[index] = { ...base[index]!, readiness }
  }
  return base
}

describe("resolveGuildRaidTeamReadiness", () => {
  it("is 100 when every hero slot and the Machine of War are fully ready", () => {
    expect(resolveGuildRaidTeamReadiness(fullyReadySlots(), 100)).toBe(100)
  })

  it("is 0 when every slot and the Machine of War are at 0", () => {
    const slots = [true, true, false, false, false].map((essential) => ({
      readiness: 0,
      essential,
    }))
    expect(resolveGuildRaidTeamReadiness(slots, 0)).toBe(0)
  })

  it("lowers team readiness more for an essential-slot shortfall than an equal flex-slot shortfall", () => {
    const essentialShortfall = resolveGuildRaidTeamReadiness(
      fullyReadySlots([{ index: 0, readiness: 0 }]),
      100
    )
    const flexShortfall = resolveGuildRaidTeamReadiness(
      fullyReadySlots([{ index: 2, readiness: 0 }]),
      100
    )

    expect(essentialShortfall).toBeLessThan(flexShortfall)
    expect(essentialShortfall).toBeLessThan(100)
    expect(flexShortfall).toBeLessThan(100)
  })

  it("weighs a Machine-of-War shortfall the same as a flex-slot shortfall", () => {
    const mowShortfall = resolveGuildRaidTeamReadiness(fullyReadySlots(), 0)
    const flexShortfall = resolveGuildRaidTeamReadiness(
      fullyReadySlots([{ index: 2, readiness: 0 }]),
      100
    )
    expect(mowShortfall).toBe(flexShortfall)
  })
})
