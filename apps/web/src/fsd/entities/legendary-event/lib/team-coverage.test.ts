import { describe, expect, it } from "vitest"

import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"

import { derivedTeamCoverage, reconcileCoverage } from "./team-coverage"

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

describe("reconcileCoverage", () => {
  it("follows A then B: everything A derives is ticked, then only the shared ones remain", () => {
    const afterA = reconcileCoverage([], [], derive([teamUnits.a.id]))
    expect(afterA).toEqual([MELEE, MIN_5_HITS, NO_RESILIENT])
    const afterB = reconcileCoverage(
      afterA,
      derive([teamUnits.a.id]),
      derive([teamUnits.a.id, teamUnits.b.id])
    )
    expect(afterB).toEqual([MELEE, MIN_5_HITS])
  })

  it("keeps an untick while the objective still derives", () => {
    const derived = derive([teamUnits.a.id, teamUnits.b.id])
    // Saved with Min 5 Hits unticked; reopened with the same members.
    expect(reconcileCoverage([MELEE], derived, derived)).toEqual([MELEE])
  })

  it("re-ticks an objective that newly derives and keeps the untick of one that still derives", () => {
    const withB = derive([teamUnits.a.id, teamUnits.b.id])
    const withoutB = derive([teamUnits.a.id])
    expect(reconcileCoverage([MELEE], withB, withoutB)).toEqual([
      MELEE,
      NO_RESILIENT,
    ])
  })

  it("adds nothing on display when previous and current derivation are the same", () => {
    const derived = derive([teamUnits.a.id])
    expect(reconcileCoverage([MELEE, 4], derived, derived)).toEqual([MELEE])
  })
})
