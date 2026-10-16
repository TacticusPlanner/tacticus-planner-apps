import { describe, expect, it } from "vitest"

import { MIN_TEAM_MEMBERS, isCompleteTeam } from "./team-size"

const team = (
  memberUnitIds: string[],
  reserveUnitId: string | null = null
) => ({
  memberUnitIds,
  reserveUnitId,
})

describe("isCompleteTeam", () => {
  it("needs three members", () => {
    expect(MIN_TEAM_MEMBERS).toBe(3)
  })

  it("rejects two members", () => {
    expect(isCompleteTeam(team(["a", "b"]))).toBe(false)
  })

  it("does not count the reserve", () => {
    expect(isCompleteTeam(team(["a", "b"], "c"))).toBe(false)
  })

  it("accepts three members", () => {
    expect(isCompleteTeam(team(["a", "b", "c"]))).toBe(true)
  })

  it("accepts five members", () => {
    expect(isCompleteTeam(team(["a", "b", "c", "d", "e"]))).toBe(true)
  })
})
