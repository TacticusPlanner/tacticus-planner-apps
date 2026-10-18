import { describe, expect, it } from "vitest"

import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"

import { derivedTeamCoverage } from "./team-coverage"

const MELEE = 0
const MIN_5_HITS = 1
const NO_RESILIENT = 2
const derive = (ids: string[]) =>
  derivedTeamCoverage(ids, teamLane, teamUnitList)

describe("derivedTeamCoverage", () => {
  it("covers what every member satisfies", () => {
    expect(derive([teamUnits.a.id])).toEqual([MELEE, MIN_5_HITS, NO_RESILIENT])
    expect(derive([teamUnits.a.id, teamUnits.b.id])).toEqual([
      MELEE,
      MIN_5_HITS,
    ])
  })

  it("derives nothing without members or for an unknown member", () => {
    expect(derive([])).toEqual([])
    expect(derive([teamUnits.a.id, "gone"])).toEqual([])
  })

  it("is unaffected by a reserve, which is never passed as a member", () => {
    // R does not satisfy Melee; A and B with R as reserve still cover Melee.
    expect(derive([teamUnits.r.id])).not.toContain(MELEE)
    expect(derive([teamUnits.a.id, teamUnits.b.id])).toContain(MELEE)
  })
})
