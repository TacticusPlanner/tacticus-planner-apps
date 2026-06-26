import { describe, expect, it } from "vitest"

import {
  characterViewSchema,
  datasetPayloadSchemas,
  manifestSchema,
} from "./schemas"

const validCharacter = {
  id: "ultraApothecary",
  name: "Apothecary",
  faction: "Ultramarines",
  alliance: "Imperial",
  health: 100,
  damage: 20,
  armour: 10,
  initialRarity: "Common",
  meleeDamage: "Physical",
  meleeHits: 3,
  rangedDamage: null,
  rangedHits: null,
  rangeDistance: null,
  movement: 4,
  traits: ["Healer"],
  activeAbilityNames: [],
  passiveAbilityNames: [],
  equipmentSlots: ["I_Crit"],
  icon: "icon.png",
  roundIcon: "round.png",
  rankUpUpgrades: [{ rank: "Stone1", upgradeIds: ["upgArmC001"] }],
  shardLocations: [],
  eligibleEquipment: [{ slot: "I_Crit", equipmentIds: ["I_Crit_C001"] }],
}

const lreTrack = {
  name: "Alpha",
  enemies: { label: "Enemies", link: "https://example.com" },
  killPoints: 10,
  battlesPoints: [1, 2],
  defeatAll: [3],
  allowedUnitsFilter: [],
  unitsRestrictions: [],
  battles: [],
  availableUnitIds: [],
}

const baseLre = {
  id: "emperLucius",
  name: "Lucius",
  wikiLink: "https://example.com",
  eventStage: 1,
  finished: false,
  battlesCount: 0,
  constraintsCount: 0,
  regularMissions: [],
  premiumMissions: [],
  alpha: lreTrack,
  beta: lreTrack,
  gamma: lreTrack,
  pointsMilestones: [{ milestone: 1, cumulativePoints: 100, engramPayout: 25 }],
  chestsMilestones: [{ chestLevel: 1, engramCost: 60 }],
  shardsPerChest: 1,
  progression: {
    unlock: 400,
    fourStars: 120,
    fiveStars: 180,
    blueStar: 200,
    mythic: 250,
    twoBlueStars: 150,
  },
}

describe("catalog schemas", () => {
  it("parses a valid character", () => {
    expect(characterViewSchema.parse(validCharacter).id).toBe("ultraApothecary")
  })

  it("preserves unknown server-added fields (loose)", () => {
    const parsed = characterViewSchema.parse({
      ...validCharacter,
      futureField: 7,
    }) as Record<string, unknown>

    expect(parsed.futureField).toBe(7)
  })

  it("rejects a record missing a required field", () => {
    const withoutName: Record<string, unknown> = { ...validCharacter }
    delete withoutName.name

    expect(characterViewSchema.safeParse(withoutName).success).toBe(false)
  })

  it("rejects a field of the wrong type", () => {
    expect(
      characterViewSchema.safeParse({ ...validCharacter, health: "lots" })
        .success
    ).toBe(false)
  })

  it("validates the mows payload as a plain array of items", () => {
    const result = datasetPayloadSchemas.mows.safeParse([
      {
        id: "m1",
        name: "Stomper",
        unitKind: "mow",
        faction: "Orks",
        alliance: "Xenos",
        icon: "i.png",
        roundIcon: "r.png",
        primaryAbility: { name: "Smash", recipes: [["upgX"]] },
        secondaryAbility: { name: "Crush", recipes: [] },
      },
    ])

    expect(result.success).toBe(true)
  })

  it("validates the mow-upgrade-costs ladder as its own dataset", () => {
    const result = datasetPayloadSchemas["mow-upgrade-costs"].safeParse([
      {
        level: 2,
        gold: 10,
        salvage: 5,
        badges: { rarity: "Common", amount: 1 },
        components: 1,
      },
    ])

    expect(result.success).toBe(true)
  })

  it("validates equipment with the inlined per-rarity upgrade ladder", () => {
    const result = datasetPayloadSchemas.equipment.safeParse([
      {
        id: "e1",
        name: "Field",
        rarity: "Common",
        type: "I_Crit",
        isRelic: false,
        isUniqueRelic: false,
        allowedUnits: [],
        allowedFactions: [],
        levels: [{ stats: { armor: 476, hp: 892 } }],
        upgradeLevels: [{ goldCost: 0, salvageCost: 10, mythicSalvageCost: 0 }],
      },
    ])

    expect(result.success).toBe(true)
  })

  it("validates an LRE with typed milestones and progression", () => {
    const result = datasetPayloadSchemas.lres.safeParse([baseLre])

    expect(result.success).toBe(true)
  })

  it("rejects an LRE points milestone of the wrong type", () => {
    const result = datasetPayloadSchemas.lres.safeParse([
      {
        ...baseLre,
        pointsMilestones: [
          { milestone: "one", cumulativePoints: 100, engramPayout: 25 },
        ],
      },
    ])

    expect(result.success).toBe(false)
  })

  it("validates the split campaign-battles and campaign-definitions payloads", () => {
    const battles = datasetPayloadSchemas["campaign-battles"].safeParse([
      {
        id: "I01",
        campaignGroupId: "indomitus",
        difficulty: "standard",
        energyCost: 0,
        nodeNumber: 1,
        slots: 1,
        rewards: { guaranteed: [], potential: [] },
        enemyPower: 34,
        enemiesAlliances: ["Xenos"],
        enemiesFactions: ["Necrons"],
        enemiesTotal: 5,
        enemiesTypes: [],
        detailedEnemyTypes: [],
      },
    ])
    const definitions = datasetPayloadSchemas["campaign-definitions"].safeParse(
      [
        {
          groupId: "indomitus",
          faction: "Ultramarines",
          releaseType: "standard",
          coreCharacters: ["ultraTigurius"],
          difficulties: ["standard"],
          battleIds: ["I01"],
        },
      ]
    )

    expect(battles.success).toBe(true)
    expect(definitions.success).toBe(true)
  })

  it("validates a manifest", () => {
    const result = manifestSchema.safeParse({
      version: "dev-1",
      schemaVersion: 11,
      gameVersion: "1.40",
      sourceHash: "abc",
      datasets: [
        {
          key: "characters",
          hash: "h1",
          url: "/api/v1/game-catalog/characters",
        },
      ],
    })

    expect(result.success).toBe(true)
  })
})
