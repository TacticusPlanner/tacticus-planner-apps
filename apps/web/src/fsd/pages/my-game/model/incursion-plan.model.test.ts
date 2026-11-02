import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import {
  DAMAGE_SHARE,
  estimateTierRun,
  INCURSION_POWER_RATIO,
  hasSustain,
  incursionBattlePower,
  lightestPath,
  suggestIncursionTeam,
  type IncursionCandidate,
} from "./incursion-plan.model"

const broadside = incursionsFixture.find(
  (incursion) => incursion.mowId === "tauBroadside"
)!
const common1 = broadside.tiers[0]!

describe("incursionBattlePower", () => {
  it("sums enemy power × count, scaled by the battle's difficulty", () => {
    const battle = {
      difficultyMultiplier: 150,
      enemies: [
        { npcId: "a", level: 1, count: 2 },
        { npcId: "b", level: 3, count: 1 },
      ],
    }
    const power = (npcId: string, level: number) =>
      npcId === "a" ? 100 : level * 10
    expect(incursionBattlePower(battle, power)).toBe(345)
    expect(incursionBattlePower(battle, () => null)).toBeNull()
  })
})

describe("lightestPath", () => {
  it("takes the lighter branch, skipping a battle where an enhancement can replace it", () => {
    // Common 1 offers battle 4 or 5 and battle 8 or 9, and lets an enhancement replace battles 2,
    // 6 and 11; battles 1, 3, 7, 10 and 12 cannot be avoided.
    const heavy = new Set(["4", "9"])
    const path = lightestPath(common1, (battle) =>
      heavy.has(battle.id) ? 1000 : 100
    )!
    expect(path.map((step) => step.battleId)).toEqual([
      "1",
      "3",
      "5",
      "7",
      "8",
      "10",
      "12",
    ])
    expect(lightestPath(common1, () => null)).toBeNull()
  })
})

describe("estimateTierRun", () => {
  const path = [100, 100, 100, 100].map((power, at) => ({
    battleId: String(at + 1),
    power,
  }))

  it("carries damage over, so a team that wins each battle alone can run out of HP", () => {
    // A 20-power team fights at 100, so each battle costs DAMAGE_SHARE × 100 / 100 = 20% of the HP.
    expect(INCURSION_POWER_RATIO).toBe(5)
    expect(DAMAGE_SHARE).toBe(0.2)
    expect(estimateTierRun(20, path, false)).toEqual({
      wins: 4,
      battles: 4,
      cleared: true,
      hpLeftPct: 20,
      peakPower: 100,
    })
    // Six 90-power battles cost 18% each: five leave 10%, too little for the sixth.
    const longer = Array.from({ length: 6 }, (_, at) => ({
      battleId: String(at + 1),
      power: 90,
    }))
    expect(estimateTierRun(20, longer, false)).toMatchObject({
      wins: 5,
      battles: 6,
      cleared: false,
    })
  })

  it("loses a battle stronger than the team's effective power", () => {
    expect(estimateTierRun(19, path, false).wins).toBe(0)
  })

  it("loses less HP with support", () => {
    expect(estimateTierRun(20, path, true).hpLeftPct).toBe(40)
  })

  it("estimates nothing without power", () => {
    expect(estimateTierRun(0, path, false).wins).toBe(0)
  })
})

const hero = (
  id: string,
  power: number,
  traits: string[] = [],
  faction = "Ultramarines"
): IncursionCandidate => ({ id, faction, traits, power })

describe("suggestIncursionTeam", () => {
  const roster = [
    hero("a", 900),
    hero("b", 800),
    hero("c", 700),
    hero("d", 600),
    hero("e", 500),
    hero("medic", 100, ["Healer"]),
    hero("ork", 5000, [], "Orks"),
  ]

  it("takes the strongest allowed heroes and swaps in a Healer for the weakest", () => {
    const team = suggestIncursionTeam(roster, ["Ultramarines"], 3)!
    expect(team.map((unit) => unit.id)).toEqual(["a", "b", "c", "d", "medic"])
    expect(hasSustain(team)).toBe(true)
  })

  it("needs the minimum number of allowed heroes", () => {
    expect(suggestIncursionTeam(roster, ["Orks"], 3)).toBeNull()
    expect(suggestIncursionTeam(roster, ["Orks"], 1)).toHaveLength(1)
  })

  it("counts a Mechanic only with a Mechanical ally", () => {
    expect(hasSustain([hero("m", 1, ["Mechanic"]), hero("x", 1)])).toBe(false)
    expect(
      hasSustain([hero("m", 1, ["Mechanic"]), hero("x", 1, ["Mechanical"])])
    ).toBe(true)
  })
})
