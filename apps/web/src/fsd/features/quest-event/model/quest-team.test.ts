import { describe, expect, it } from "vitest"

import { characterPowerAt } from "@/shared/unit-power"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import {
  capUnitState,
  featuredHeroState,
  passesObjective,
  selectQuestTeam,
  type QuestTeamCandidate,
  type QuestTeamCharacter,
} from "./quest-team"
import { questTierCap } from "./quest-tier-cap"

const unit = (
  id: string,
  overrides: Partial<QuestTeamCharacter> = {}
): QuestTeamCharacter => ({
  id,
  faction: "Ultramarines",
  traits: [],
  meleeDamage: "Power",
  meleeHits: 1,
  rangedDamage: null,
  rangedHits: null,
  activeAbilityDamage: [],
  passiveAbilityDamage: [],
  ...overrides,
})

const candidate = (
  character: QuestTeamCharacter,
  power: number | null
): QuestTeamCandidate => ({
  character,
  power,
  atCap: true,
  progression: "Legendary:RedFiveStars",
  rank: "Diamond3",
})

const uncommon = questTierCap("Uncommon", undefined)
const synced = {
  unitId: "ultraCalgar",
  rank: "Gold2" as const,
  progressionIndex: "Legendary:RedFourStars" as const,
  appliedUpgradeSlots: [0, 1],
  abilities: [{ level: 40 }, { level: 30 }],
  equippedItems: [{ equipmentId: "I_Crit_L001", level: 9 }],
}

describe("capUnitState", () => {
  it("clamps abilities, progression, rank and items to the tier's cap", () => {
    const { values, atCap } = capUnitState(synced, {
      ...uncommon,
      itemLevel: 5,
    })

    expect(atCap).toBe(true)
    expect(values).toMatchObject({
      progression: "Uncommon:FourStars",
      rank: "Bronze1",
      appliedUpgradeSlots: [],
      activeAbilityLevel: 17,
      passiveAbilityLevel: 17,
      items: [{ equipmentId: "I_Crit_L001", level: 5 }],
    })
  })

  it("keeps a unit below the cap as it is", () => {
    const rare = {
      ...synced,
      rank: "Silver1" as const,
      progressionIndex: "Rare:FiveStars" as const,
      abilities: [{ level: 20 }, { level: 20 }],
    }
    const { values, atCap } = capUnitState(
      rare,
      questTierCap("Legendary", undefined)
    )

    expect(atCap).toBe(false)
    expect(values).toMatchObject({
      progression: "Rare:FiveStars",
      rank: "Silver1",
      appliedUpgradeSlots: [0, 1],
      activeAbilityLevel: 20,
      passiveAbilityLevel: 20,
      items: [{ equipmentId: "I_Crit_L001", level: 9 }],
    })
  })

  it("gives the featured hero the cap with the 1.2 stat factor and more power for it", () => {
    const state = featuredHeroState(questTierCap("Epic", undefined))
    expect(state).toMatchObject({
      progression: expect.stringMatching(/^Epic:/),
      rank: "Gold1",
      activeAbilityLevel: 35,
      items: [],
      statFactor: 1.2,
    })
    const context = unitPowerContextFixture()
    expect(characterPowerAt("ultraCalgar", state, context)).toBeGreaterThan(
      characterPowerAt("ultraCalgar", { ...state, statFactor: 1 }, context)!
    )
  })
})

describe("passesObjective", () => {
  const none = new Set<string>()
  const objective = (type: string, target: string | null = null) => ({
    type,
    target,
    score: 100,
  })

  it.each([
    ["NotTrait", "Psyker", unit("a", { traits: ["Psyker"] }), false],
    ["NotTrait", "Psyker", unit("a"), true],
    ["NotFaction", "Ultramarines", unit("a"), false],
    ["NotDamageType", "Power", unit("a"), false],
    ["NotDamageType", "Bolter", unit("a"), true],
    ["HasRangedAttack", null, unit("a"), false],
    [
      "HasRangedAttack",
      null,
      unit("a", { rangedDamage: "Bolter", rangedHits: 2 }),
      true,
    ],
    [
      "MaxHits",
      "3",
      unit("a", { rangedDamage: "Bolter", rangedHits: 4 }),
      false,
    ],
    ["MaxHits", "3", unit("a", { meleeHits: 3 }), true],
    ["MinHits", "3", unit("a", { meleeHits: 2 }), false],
    ["DoNoHealOrRepair", null, unit("a", { traits: ["Mechanic"] }), false],
    ["DoNoHealOrRepair", null, unit("a"), true],
  ] as const)("%s %s", (type, target, character, expected) => {
    expect(passesObjective(character, objective(type, target), none)).toBe(
      expected
    )
  })

  it("rules out summoners and filters nobody for DamageType", () => {
    expect(
      passesObjective(unit("a"), objective("UseNoSummons"), new Set(["a"]))
    ).toBe(false)
    expect(
      passesObjective(unit("a"), objective("DamageType", "Bolter"), none)
    ).toBeNull()
  })
})

describe("selectQuestTeam", () => {
  const nubari = unit("astarEradicator", { faction: "AdeptusAstartes" })
  const base = {
    featured: nubari,
    featuredPower: 1000,
    allowedFactionIds: ["AdeptusAstartes", "Ultramarines"],
    summoners: new Set<string>(),
  }

  it("leaves out Psykers for a no-Psyker battle and keeps the others", () => {
    const team = selectQuestTeam({
      ...base,
      candidates: [
        candidate(unit("psyker", { traits: ["Psyker"] }), 900),
        candidate(unit("calgar"), 800),
        candidate(unit("xenos", { faction: "Necrons" }), 950),
      ],
      objectives: [{ type: "NotTrait", target: "Psyker", score: 100 }],
      deploySlots: 3,
    })

    expect(team.members.map((member) => member.unitId)).toEqual([
      "astarEradicator",
      "calgar",
    ])
    expect(team.badges).toEqual([{ kind: "met" }])
    expect(team.eligibleCount).toBe(1)
  })

  it("stops filtering for an objective the featured hero fails", () => {
    const team = selectQuestTeam({
      ...base,
      featured: unit("hero", { faction: "Ultramarines" }),
      candidates: [candidate(unit("calgar"), 800)],
      objectives: [{ type: "NotFaction", target: "Ultramarines", score: 100 }],
      deploySlots: 3,
    })

    expect(team.members.map((member) => member.unitId)).toContain("calgar")
    expect(team.badges).toEqual([{ kind: "unreachable" }])
  })

  it("fills five slots with the four strongest non-Flying units, ties by id", () => {
    const candidates = Array.from({ length: 10 }, (_, index) =>
      candidate(
        unit(`u${index}`, { traits: index % 3 === 0 ? ["Flying"] : [] }),
        index === 8 ? 700 : index * 100
      )
    )
    const team = selectQuestTeam({
      ...base,
      candidates,
      objectives: [{ type: "NotTrait", target: "Flying", score: 100 }],
      deploySlots: 5,
    })

    expect(team.members.map((member) => member.unitId)).toEqual([
      "astarEradicator",
      "u7",
      "u8",
      "u5",
      "u4",
    ])
    expect(team.totalPower).toBe(1000 + 700 + 700 + 500 + 400)
  })

  it("swaps the weakest pick for the strongest unit dealing a required damage type", () => {
    const team = selectQuestTeam({
      ...base,
      candidates: [
        candidate(unit("a"), 900),
        candidate(unit("b"), 800),
        candidate(
          unit("bolter", { rangedDamage: "Bolter", rangedHits: 2 }),
          500
        ),
      ],
      objectives: [{ type: "DamageType", target: "Bolter", score: 100 }],
      deploySlots: 3,
    })

    expect(team.members.map((member) => member.unitId)).toEqual([
      "astarEradicator",
      "a",
      "bolter",
    ])
    expect(team.badges).toEqual([{ kind: "met" }])
  })

  it("shows the featured hero alone when nobody is eligible", () => {
    const team = selectQuestTeam({
      ...base,
      candidates: [candidate(unit("x", { faction: "Necrons" }), 500)],
      objectives: [
        { type: "NoDamageTakenByAnyHero", target: null, score: 100 },
        { type: "DamageType", target: "Bolter", score: 100 },
      ],
      deploySlots: 3,
    })

    expect(team.members).toHaveLength(1)
    expect(team).toMatchObject({ eligibleCount: 0, openSlots: 2 })
    expect(team.badges).toEqual([
      { kind: "dependsOnPlay" },
      { kind: "noEligible" },
    ])
  })

  it("orders by rarity and rank when power is unavailable", () => {
    const team = selectQuestTeam({
      ...base,
      featuredPower: null,
      candidates: [
        { ...candidate(unit("low"), null), rank: "Gold1" },
        { ...candidate(unit("high"), null), rank: "Diamond1" },
      ],
      objectives: [],
      deploySlots: 3,
    })

    expect(team.members.map((member) => member.unitId)).toEqual([
      "astarEradicator",
      "high",
      "low",
    ])
    expect(team).toMatchObject({ powerUnavailable: true, totalPower: null })
  })
})
