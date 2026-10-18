import { describe, expect, it } from "vitest"

import { progressionAt } from "./progression"
import { rankAt } from "./rank"
import {
  characterPower,
  characterStats,
  mowPower,
  npcPower,
  unitPowerTables,
  UnitPowerDataError,
  type CharacterPowerState,
  type PowerCharacter,
  type PowerItem,
  type PowerNpc,
  type PowerNpcRow,
  type UnitPowerRecord,
  type UpgradeStat,
} from "./unit-power"
// Copied from the catalog source (tacticus-planner-api GameCatalog Data): the served `unit-power`
// record, a few characters, items and upgrades, and every Legendary Event wave with its NPCs.
import unitPowerRecord from "./test-fixtures/unit-power.json"
import powerUnits from "./test-fixtures/power-units.json"
import leWavePower from "./test-fixtures/le-wave-power.json"

const tables = unitPowerTables(unitPowerRecord as UnitPowerRecord)
const upgradeStats = new Map(
  Object.entries(powerUnits.upgradeStats) as [string, UpgradeStat][]
)
const items = new Map(
  (powerUnits.items as PowerItem[]).map((item) => [item.id, item])
)

function character(id: string): PowerCharacter {
  const found = (powerUnits.characters as PowerCharacter[]).find(
    (unit) => unit.id === id
  )
  if (!found) throw new Error(`No fixture character ${id}`)
  return found
}

function state(
  overrides: Partial<CharacterPowerState> & {
    rankIndex?: number
    progressionIndex?: number
    equipment?: [string, number][]
  }
): CharacterPowerState {
  const {
    rankIndex = 0,
    progressionIndex = 0,
    equipment = [],
    ...rest
  } = overrides
  return {
    rank: rankAt(rankIndex),
    progression: progressionAt(progressionIndex),
    appliedUpgradeSlots: [],
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
    ...rest,
    items: equipment.map(([id, level]) => {
      const item = items.get(id)
      if (!item) throw new Error(`No fixture item ${id}`)
      return { item, level }
    }),
  }
}

const tigurius = state({
  rankIndex: 12,
  progressionIndex: 9,
  appliedUpgradeSlots: [0, 1, 2],
  activeAbilityLevel: 20,
  passiveAbilityLevel: 15,
})

// V1's hand-built fixture (`character-power.test.ts`).
const testRecord: UnitPowerRecord = {
  heroProgressionSteps: [
    { unitStatMultiplierPct: 100, abilityPowerMultiplier: 100 },
  ],
  mowProgressionSteps: [
    { abilityPowerMultiplier: 2, mythicAbilityPower: 0 },
    { abilityPowerMultiplier: 3, mythicAbilityPower: 5000 },
  ],
  damageProfileModifiers: [{ damageType: "Bolter", modifier: 100 }],
  traitPowerModifiers: [{ traitId: "MachineOfWar", modifier: 100 }],
  abilityPowerModifiers: [],
  abilityPowerCurves: {
    active: [10, 20],
    passive: [5, 15],
    relic: [1000, 2000, 3000],
  },
  units: [
    { unitId: "testUnit", powerMultiplier: 100, rankUpStatIncreases: [[50]] },
    { unitId: "testMachine", powerMultiplier: 100, rankUpStatIncreases: [] },
  ],
}
const testTables = unitPowerTables(testRecord)
const testUnit: PowerCharacter = {
  id: "testUnit",
  health: 100,
  damage: 10,
  armour: 0,
  movement: 16,
  traits: [],
  meleeDamage: "Bolter",
  meleeHits: 1,
  activeAbilityNames: ["activeA"],
  passiveAbilityNames: ["passiveA"],
  rankUpUpgrades: [{ upgradeIds: ["hpUpgrade"] }, { upgradeIds: [] }],
}
const testUpgrades = new Map<string, UpgradeStat>([["hpUpgrade", "Health"]])
const testState: CharacterPowerState = {
  rank: rankAt(0),
  progression: progressionAt(0),
  appliedUpgradeSlots: [],
  activeAbilityLevel: 2,
  passiveAbilityLevel: 2,
}
const relic: PowerItem = {
  id: "relicItem",
  abilityId: "someRelicAbility",
  levels: [{ stats: {} }, { stats: {} }, { stats: {} }],
}

describe("characterPower", () => {
  it("reproduces V1's hand-built fixture", () => {
    expect(characterPower(testTables, testUnit, testState, testUpgrades)).toBe(
      3514
    )
  })

  it("gives a higher rank more power", () => {
    const high = { ...testState, rank: rankAt(1) }
    expect(
      characterPower(testTables, testUnit, high, testUpgrades)
    ).toBeGreaterThan(
      characterPower(testTables, testUnit, testState, testUpgrades)
    )
  })

  it("adds relic ability power for an equipped relic", () => {
    const withRelic = { ...testState, items: [{ item: relic, level: 2 }] }
    expect(characterPower(testTables, testUnit, withRelic, testUpgrades)).toBe(
      characterPower(testTables, testUnit, testState, testUpgrades) + 2000
    )
  })

  it("applies √0.9 as the melee range modifier", () => {
    const big = { ...testUnit, health: 100_000, damage: 10_000 }
    const noAbilities = {
      ...testState,
      activeAbilityLevel: 0,
      passiveAbilityLevel: 0,
    }
    const statsPower = Math.pow(100_000 * 10_000 * Math.sqrt(0.9), 2 / 3)
    expect(characterPower(testTables, big, noAbilities, testUpgrades)).toBe(
      Math.round(10 + (statsPower * Math.sqrt(16)) / 100)
    )
  })

  it("throws for a unit the tables don't know", () => {
    expect(() =>
      characterPower(
        testTables,
        { ...testUnit, id: "unknownUnit" },
        testState,
        testUpgrades
      )
    ).toThrow(UnitPowerDataError)
  })

  it("throws for an item level the item doesn't have", () => {
    const tooHigh = { ...testState, items: [{ item: relic, level: 4 }] }
    expect(() =>
      characterPower(testTables, testUnit, tooHigh, testUpgrades)
    ).toThrow(/relicItem/)
  })

  it("reproduces the in-game power of Kharn and Gulgortz", () => {
    const kharn = state({
      rankIndex: 19,
      progressionIndex: 18,
      activeAbilityLevel: 60,
      passiveAbilityLevel: 60,
      equipment: [
        ["I_Crit_M006", 1],
        ["I_Booster_Crit_M003", 1],
        ["I_Block_M003", 1],
      ],
    })
    const gulgortz = state({
      rankIndex: 19,
      progressionIndex: 16,
      activeAbilityLevel: 60,
      passiveAbilityLevel: 60,
      equipment: [
        ["R_Crit_HeadwoppasKillchoppa", 6],
        ["I_Block_L003", 11],
        ["I_Booster_Block_M002", 1],
      ],
    })
    expect(
      characterPower(tables, character("worldKharn"), kharn, upgradeStats)
    ).toBe(936_827)
    expect(
      characterPower(tables, character("orksWarboss"), gulgortz, upgradeStats)
    ).toBe(1_037_811)
  })

  it("gives Tigurius at Gold I 16,672, and 16,809 with a level 3 Combat Knife", () => {
    const unit = character("ultraTigurius")
    expect(characterStats(tables, unit, tigurius, upgradeStats)).toEqual({
      health: 1786,
      damage: 768,
      armour: 332,
    })
    expect(characterPower(tables, unit, tigurius, upgradeStats)).toBe(16_672)
    const knife = {
      ...tigurius,
      items: state({ equipment: [["I_Crit_C001", 3]] }).items,
    }
    expect(characterPower(tables, unit, knife, upgradeStats)).toBe(16_809)
  })
})

describe("characterStats", () => {
  it("gives Tigurius at Adamantine II, Mythic 2 blue stars 7,955 / 3,671 / 1,713", () => {
    expect(
      characterStats(
        tables,
        character("ultraTigurius"),
        state({ rankIndex: 19, progressionIndex: 17 }),
        upgradeStats
      )
    ).toEqual({ health: 7955, damage: 3671, armour: 1713 })
  })

  it("ignores items", () => {
    const unit = character("ultraTigurius")
    const withKnife = {
      ...tigurius,
      items: state({ equipment: [["I_Crit_C001", 3]] }).items,
    }
    expect(characterStats(tables, unit, withKnife, upgradeStats)).toEqual(
      characterStats(tables, unit, tigurius, upgradeStats)
    )
  })

  it("throws for an upgrade whose stat is unknown", () => {
    expect(() =>
      characterStats(tables, character("ultraTigurius"), tigurius, new Map())
    ).toThrow(UnitPowerDataError)
  })
})

describe("mowPower", () => {
  const machine = {
    id: "testMachine",
    primaryAbility: { name: "primaryA" },
    secondaryAbility: { name: "secondaryA" },
  }
  const mowState = {
    progression: progressionAt(0),
    primaryAbilityLevel: 2,
    secondaryAbilityLevel: 2,
  }

  it("reproduces V1's maxed Biovore", () => {
    expect(
      mowPower(tables, powerUnits.mows[0], {
        progression: progressionAt(19),
        primaryAbilityLevel: 60,
        secondaryAbilityLevel: 60,
      })
    ).toBe(1_040_687)
  })

  it("gives Biovore at Mythic 1 blue star with maxed abilities 873,548", () => {
    expect(
      mowPower(tables, powerUnits.mows[0], {
        progression: progressionAt(16),
        primaryAbilityLevel: 60,
        secondaryAbilityLevel: 60,
      })
    ).toBe(873_548)
  })

  it("adds the flat mythic ability power once the step unlocks it", () => {
    const withMythic = { ...mowState, progression: progressionAt(1) }
    expect(mowPower(testTables, machine, withMythic)).toBe(
      Math.round(10 + (20 + 15) * 3 + 5000)
    )
    expect(mowPower(testTables, machine, mowState)).toBe(
      Math.round(10 + (20 + 15) * 2)
    )
  })

  it("throws for a MoW the tables don't know", () => {
    expect(() =>
      mowPower(testTables, { ...machine, id: "unknownMachine" }, mowState)
    ).toThrow(/unknownMachine/)
  })
})

type WaveNpc = PowerNpc & { stats: Record<string, PowerNpcRow> }

describe("npcPower", () => {
  it("gives the Dark Angels Infiltrator's third row 45", () => {
    const infiltrator = powerUnits.npcs[0]
    expect(npcPower(tables, infiltrator, infiltrator.stats[2])).toBe(45)
  })

  it("gives an NPC with no weapon only its base and ability power", () => {
    const watcher: PowerNpc = {
      id: "watcher",
      movement: 3,
      traits: [],
      meleeDamage: "",
      meleeHits: 0,
      activeAbilities: [],
      passiveAbilities: [],
    }
    const row = {
      health: 50,
      damage: 0,
      armour: 0,
      abilityLevel: 1,
      progressionIndex: 0,
    }
    expect(npcPower(tables, watcher, row)).toBe(10)
  })

  // Pins today's coverage: the summed NPC power matches the game's wave power (within one per
  // enemy) for this many Legendary Event waves. A data refresh that improves or breaks it shows here.
  it("matches the catalog power of 655 of the 1,296 Legendary Event waves", () => {
    const npcs = new Map(
      (leWavePower.npcs as WaveNpc[]).map((npc) => [npc.id, npc])
    )
    const matching = leWavePower.waves.filter((wave) => {
      let total = 0
      for (const [id, stars, count] of wave.enemies as [
        string,
        number,
        number,
      ][]) {
        const row = npcs.get(id)?.stats[String(Math.max(stars - 1, 0))]
        if (!row) return false
        total += npcPower(tables, npcs.get(id)!, row) * count
      }
      return Math.abs(total - wave.power) <= wave.enemies.length * 2
    })
    expect(leWavePower.waves).toHaveLength(1296)
    expect(matching).toHaveLength(655)
  })
})
