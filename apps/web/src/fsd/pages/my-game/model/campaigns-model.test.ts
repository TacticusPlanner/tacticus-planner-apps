import { describe, expect, it } from "vitest"

import { percentLabel, summarize } from "./campaigns-model"
import type { BuiltTrack } from "./campaigns-model"

const track = (overrides: Partial<BuiltTrack> = {}): BuiltTrack => ({
  definition: {} as BuiltTrack["definition"],
  type: "Standard",
  max: 10,
  completed: 10,
  medals: undefined,
  unclaimed: undefined,
  ...overrides,
})

describe("percentLabel", () => {
  it("rounds down, so it reads 100% only when everything is earned", () => {
    expect(percentLabel({ done: 1832, total: 1840 })).toBe(99)
    expect(percentLabel({ done: 1840, total: 1840 })).toBe(100)
    expect(percentLabel({ done: 0, total: 0 })).toBe(0)
  })
})

describe("summarize", () => {
  it("counts battles when no medals are recorded", () => {
    expect(summarize([track({ completed: 9 }), track()]).completion).toEqual({
      done: 19,
      total: 20,
      basis: "battles",
    })
    expect(summarize([track({ completed: 9 }), track()]).percent).toBe(95)
  })

  it("counts medals and Lightning Victories when recorded", () => {
    const medals = {
      medals: 29,
      maxMedals: 30,
      lightningVictories: 10,
      maxLightningVictories: 10,
    } as unknown as BuiltTrack["medals"]
    const summary = summarize([track({ medals })])
    expect(summary.completion.basis).toBe("medals")
    expect(summary.percent).toBeLessThan(100)
  })
})
