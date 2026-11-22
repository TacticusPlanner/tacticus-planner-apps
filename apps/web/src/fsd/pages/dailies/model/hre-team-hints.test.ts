import { describe, expect, it } from "vitest"

import {
  DEFAULT_HRE_PROGRESS,
  hreMission,
  selectTeamPlans,
} from "@/entities/hre-mission"
import { hreMissions } from "@/test/fixtures/hre-rules"

import { hreTeamHints } from "./hre-team-hints"

const spare = {
  arena: { held: 15, need: 12 },
  onslaught: { held: 3, need: 1 },
}
const plansFor = (mission: number) =>
  selectTeamPlans({ ...DEFAULT_HRE_PROGRESS, mission }, hreMissions, spare)
const hintKeys = (mission: number, mode: string) =>
  hreTeamHints(
    plansFor(mission).find((plan) => plan.mode === mode) ??
      (() => {
        throw new Error(`mission ${mission}: no ${mode} team`)
      })()
  )

describe("hreTeamHints", () => {
  it("says why a spare-token team plays and points Arena kills at summoners", () => {
    expect(hintKeys(2, "arena")).toEqual([
      { key: "spare", held: 15, need: 12, play: 3 },
      { key: "arenaSummoners" },
    ])
  })

  it("asks Arena faction kills to fight only teams with the faction", () => {
    const mission = hreMissions.find((item) =>
      item.objectives.some((objective) => objective.kind === "killFaction")
    )
    if (!mission) throw new Error("no faction-kill mission")
    const faction = hreMission(hreMissions, mission.number).objectives.find(
      (objective) => objective.kind === "killFaction"
    )?.qualifier
    expect(hintKeys(mission.number, "arena")).toContainEqual({
      key: "arenaFaction",
      faction,
    })
  })

  it("orders Onslaught ability uses weakest first and notes no event points", () => {
    expect(hintKeys(3, "onslaught")).toEqual([
      { key: "spare", held: 3, need: 1, play: 2 },
      { key: "wholeTrack" },
      { key: "noEventPoints" },
    ])
  })

  it("gives a token objective's own team no spare hint", () => {
    // Mission 4: "Play 4 Arena battles" needs its tokens; its ranged kills ride along.
    expect(hintKeys(4, "arena")).toEqual([{ key: "arenaSummoners" }])
  })

  it("notes only the event points on an Onslaught token objective", () => {
    // Mission 12: "Play 1 Onslaught battle".
    expect(hintKeys(12, "onslaught")).toEqual([{ key: "noEventPoints" }])
  })
})
