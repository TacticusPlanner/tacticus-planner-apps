import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import {
  ENEMY_POWER_DIVISOR,
  HP_LOSS_SHARE,
  eligibleCandidates,
  estimateTierRuns,
  hasSustain,
  incursionBattlePower,
  lightestPath,
  powerStanding,
  suggestIncursionTeam,
  tierPower,
  toggleTeamMember,
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

describe("tierPower", () => {
  it("keeps every battle's power and the easiest path's toughest battle", () => {
    // Battle 4 is heavy but avoidable; battle 12 is on every path.
    const power = tierPower(common1, (battle) =>
      battle.id === "4" ? 1000 : battle.id === "12" ? 300 : 100
    )!
    expect(power.battles.get("4")).toBe(1000)
    expect(power.battles.size).toBe(common1.battles.length)
    expect(power.peakPower).toBe(300)
    expect(tierPower(common1, () => null)).toBeNull()
  })
})

describe("powerStanding", () => {
  it("compares a battle's power with the team's", () => {
    expect(powerStanding(250, 100)).toBe("even")
    expect(powerStanding(500, 100)).toBe("harder")
    expect(powerStanding(501, 100)).toBe("hard")
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

  it("lists the allowed heroes strongest first", () => {
    expect(
      eligibleCandidates(roster, ["Ultramarines"]).map((unit) => unit.id)
    ).toEqual(["a", "b", "c", "d", "e", "medic"])
  })

  it("takes the strongest allowed heroes and swaps in a Healer for the weakest", () => {
    const team = suggestIncursionTeam(
      eligibleCandidates(roster, ["Ultramarines"]),
      3
    )!
    expect(team.map((unit) => unit.id)).toEqual(["a", "b", "c", "d", "medic"])
    expect(hasSustain(team)).toBe(true)
  })

  it("needs the minimum number of allowed heroes", () => {
    const orks = eligibleCandidates(roster, ["Orks"])
    expect(suggestIncursionTeam(orks, 3)).toBeNull()
    expect(suggestIncursionTeam(orks, 1)).toHaveLength(1)
  })

  it("counts a Mechanic only with a Mechanical ally", () => {
    expect(hasSustain([hero("m", 1, ["Mechanic"]), hero("x", 1)])).toBe(false)
    expect(
      hasSustain([hero("m", 1, ["Mechanic"]), hero("x", 1, ["Mechanical"])])
    ).toBe(true)
  })
})

describe("toggleTeamMember", () => {
  it("adds and removes heroes, up to a full team", () => {
    expect(toggleTeamMember(["a"], "b")).toEqual(["a", "b"])
    expect(toggleTeamMember(["a", "b"], "a")).toEqual(["b"])
    const full = ["a", "b", "c", "d", "e"]
    expect(toggleTeamMember(full, "f")).toEqual(full)
  })
})

describe("estimateTierRuns", () => {
  const path = (...powers: number[]) =>
    powers.map((power, at) => ({ battleId: String(at + 1), power }))
  const fives = (count: number) => path(...Array<number>(count).fill(250))

  it("clears in one run while the HP lasts, the team weakening as it loses HP", () => {
    // A 100-power team faces 250 / 5 = 50 per battle, which needs half its HP; each win costs
    // 30% × 50 / 100 = 15%, so four wins leave 40%.
    expect(ENEMY_POWER_DIVISOR).toBe(5)
    expect(HP_LOSS_SHARE).toBe(0.3)
    expect(estimateTierRuns(100, fives(4), false)).toEqual({
      status: "clears",
      runs: 1,
      firstRunWins: 4,
      battles: 4,
    })
  })

  it("takes more runs once the HP runs low, keeping the battles won", () => {
    expect(estimateTierRuns(100, fives(5), false)).toEqual({
      status: "clears",
      runs: 2,
      firstRunWins: 4,
      battles: 5,
    })
  })

  it("loses less HP with support", () => {
    expect(estimateTierRuns(100, fives(5), true)).toMatchObject({
      runs: 1,
      firstRunWins: 5,
    })
  })

  it("is stuck at a battle even a fresh team can't win", () => {
    expect(estimateTierRuns(100, path(250, 501), false)).toEqual({
      status: "stuck",
      battle: "2",
      firstRunWins: 1,
      battles: 2,
    })
    expect(estimateTierRuns(0, path(1), false)).toMatchObject({
      status: "stuck",
      battle: "1",
    })
  })
})
