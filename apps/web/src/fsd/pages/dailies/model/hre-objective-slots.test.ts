import { describe, expect, it } from "vitest"

import {
  DEFAULT_HRE_PROGRESS,
  hreMission,
  selectCampaignPlan,
  selectTeamPlans,
} from "@/entities/hre-mission"
import { hreMissions } from "@/test/fixtures/hre-rules"

import { hreObjectiveSlots } from "./hre-objective-slots"

const slotsOf = (
  mission: number,
  progress: [number, number] = DEFAULT_HRE_PROGRESS.progress
) => {
  const state = { ...DEFAULT_HRE_PROGRESS, mission, progress }
  const teams = selectTeamPlans(state, hreMissions, {
    onslaught: { held: 3, need: 0 },
  }).filter((plan) => plan.mode !== "battle")
  const campaign = selectCampaignPlan(state, hreMissions)
  return hreMission(hreMissions, mission).objectives.map((objective) =>
    hreObjectiveSlots(objective, campaign, teams).map((slot) =>
      slot.kind === "team"
        ? `team:${teams[slot.planIndex]?.mode ?? "?"}`
        : slot.kind
    )
  )
}

describe("hreObjectiveSlots", () => {
  it("folds raids under their objective and the spare teams under the manual one", () => {
    // Mission 5: ability damage (by hand), campaign raids.
    expect(slotsOf(5)).toEqual([["battles", "team:onslaught"], ["raids"]])
  })

  it("folds a token objective's team under it", () => {
    // Mission 4: Arena battles, ranged kills.
    expect(slotsOf(4)).toEqual([["team:arena"], ["battles", "team:onslaught"]])
  })

  it("gives nothing without a campaign plan or teams", () => {
    const [objective] = hreMission(hreMissions, 5).objectives
    expect(hreObjectiveSlots(objective, null, [])).toEqual([])
  })

  it("gives a met objective nothing", () => {
    // Mission 5 with its campaign wins met: the raids go, the ability damage keeps its folds.
    expect(slotsOf(5, [0, 100])).toEqual([["battles", "team:onslaught"], []])
  })

  it("folds shared battles once, under the first manual objective", () => {
    // Mission 17: damage and kills, both by hand.
    expect(slotsOf(17)).toEqual([
      ["battles", "team:onslaught"],
      ["sharedBattles"],
    ])
  })
})
