import { describe, expect, it } from "vitest"

import { sameModeUsage } from "./same-mode-usage"

describe("same-mode usage", () => {
  const teams = [
    {
      id: "wo",
      name: "Offense",
      modes: ["warOffense" as const],
      characterIds: ["ultraCalgar"],
      mowIds: [],
    },
    {
      id: "h",
      name: "Horde",
      modes: ["horde" as const],
      characterIds: ["ultraTitus"],
      mowIds: [],
    },
  ]

  it("flags a unit in another team that shares a selected mode", () => {
    expect(
      sameModeUsage(teams, null, ["warOffense"]).get("ultraCalgar")
    ).toEqual(["Offense"])
  })

  it("does not flag a unit only in a team of another mode", () => {
    expect(sameModeUsage(teams, null, ["warOffense"]).has("ultraTitus")).toBe(
      false
    )
  })

  it("leaves out the team being edited", () => {
    expect(sameModeUsage(teams, "wo", ["warOffense"]).size).toBe(0)
  })

  it("flags nothing outside Guild War, and offense never clashes with defense", () => {
    expect(sameModeUsage(teams, null, ["horde"]).size).toBe(0)
    expect(sameModeUsage(teams, null, ["warDefense"]).size).toBe(0)
  })
})
