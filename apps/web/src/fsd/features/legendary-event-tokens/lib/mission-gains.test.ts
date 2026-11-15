import { describe, expect, it } from "vitest"

import type { LegendaryEventMissionRef } from "@/entities/legendary-event"

import { gainsFromProgress, gainsFromSteps } from "./mission-gains"

const ref = {
  track: "regular",
  mission: { index: 0, kind: "killEnemies", count: 30 },
} as unknown as LegendaryEventMissionRef

describe("mission gains", () => {
  it("reads a progress entry as a gain that does not finish", () => {
    expect(
      gainsFromProgress([{ ref, amount: 6, estimate: true }])
    ).toStrictEqual([{ ref, amount: 6, estimate: true, completes: false }])
  })

  it("reads a step's gained count and whether it finishes", () => {
    expect(
      gainsFromSteps([
        {
          ref,
          total: 30,
          gained: 4,
          needed: 30,
          completes: true,
          estimate: false,
        },
      ])
    ).toStrictEqual([{ ref, amount: 4, estimate: false, completes: true }])
  })

  it("leaves untracked missions out of a step's gains", () => {
    const anyBattle = {
      track: "regular",
      mission: { index: 1, kind: "anyBattle", count: 5 },
    } as unknown as LegendaryEventMissionRef
    const step = (mission: LegendaryEventMissionRef) => ({
      ref: mission,
      total: 5,
      gained: 1,
      needed: 5,
      completes: false,
      estimate: false,
    })
    expect(
      gainsFromSteps([step(anyBattle), step(ref)]).map((gain) => gain.ref)
    ).toStrictEqual([ref])
  })
})
