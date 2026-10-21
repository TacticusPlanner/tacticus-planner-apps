import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { missionDeployGroups } from "./mission-deploy-groups"

const id = (value: string) => value as BattleId
const names: Record<string, string> = {
  i20: "Indomitus",
  ie5: "Indomitus Elite",
  o10: "Octarius",
}

describe("missionDeployGroups", () => {
  it("groups nodes by the factions their campaign allows, with the most slots", () => {
    const groups = missionDeployGroups(
      [
        {
          battleId: id("i20"),
          deploy: { factions: ["Ultramarines", "AstraMilitarum"], slots: 4 },
        },
        { battleId: id("o10"), deploy: { factions: ["Orks"], slots: 5 } },
        {
          battleId: id("ie5"),
          deploy: { factions: ["AstraMilitarum", "Ultramarines"], slots: 5 },
        },
        { battleId: id("x1") },
      ],
      (battleId) => names[battleId]
    )
    expect(groups).toEqual([
      {
        factions: ["AstraMilitarum", "Ultramarines"],
        slots: 5,
        fewestSlots: 4,
        campaigns: ["Indomitus", "Indomitus Elite"],
      },
      {
        factions: ["Orks"],
        slots: 5,
        fewestSlots: 5,
        campaigns: ["Octarius"],
      },
    ])
  })
})
