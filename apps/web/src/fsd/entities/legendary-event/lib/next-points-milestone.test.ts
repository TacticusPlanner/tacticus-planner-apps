import { describe, expect, it } from "vitest"

import { nextPointsMilestone } from "./next-points-milestone"

// The head of the real lre-common ladder (Lysander's catalog source).
const realLadder = {
  pointsMilestones: [
    { milestone: 7, cumulativePoints: 2500, engramPayout: 55 },
    { milestone: 8, cumulativePoints: 3000, engramPayout: 60 },
    { milestone: 9, cumulativePoints: 3500, engramPayout: 65 },
    { milestone: 10, cumulativePoints: 4000, engramPayout: 70 },
  ],
}

describe("nextPointsMilestone", () => {
  it("returns the first milestone above the current points", () => {
    // 3,410 points: 3,000 is passed, 3,500 is next, 3,500 - 3,410 = 90 to go.
    expect(nextPointsMilestone(realLadder, 3410)).toEqual({
      milestone: 9,
      cumulativePoints: 3500,
      engramPayout: 65,
      pointsToGo: 90,
    })
  })

  it("matches the spec's run-status example (3,500, +60)", () => {
    const ladder = {
      pointsMilestones: [
        { milestone: 13, cumulativePoints: 3000, engramPayout: 55 },
        { milestone: 14, cumulativePoints: 3500, engramPayout: 60 },
      ],
    }
    expect(nextPointsMilestone(ladder, 3410)).toMatchObject({
      milestone: 14,
      cumulativePoints: 3500,
      engramPayout: 60,
      pointsToGo: 90,
    })
  })

  it("skips a milestone reached exactly", () => {
    expect(nextPointsMilestone(realLadder, 3500)?.milestone).toBe(10)
  })

  it("is undefined past the last milestone or without a ladder", () => {
    expect(nextPointsMilestone(realLadder, 4000)).toBeUndefined()
    expect(nextPointsMilestone(null, 10)).toBeUndefined()
  })
})
