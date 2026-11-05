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
})
