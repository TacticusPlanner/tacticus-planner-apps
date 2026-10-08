import { describe, expect, it } from "vitest"

import { teamLane } from "@/test/fixtures/legendary-event-teams"

import { teamPointsPerBattle } from "./team-points"

describe("teamPointsPerBattle", () => {
  it("adds the covered objectives to the kill points: 30 + 20 + 25 = 75", () => {
    expect(teamPointsPerBattle(teamLane, [0, 1])).toBe(75)
  })

  it("is the kill points alone with no objective covered", () => {
    expect(teamPointsPerBattle(teamLane, [])).toBe(30)
  })
})
