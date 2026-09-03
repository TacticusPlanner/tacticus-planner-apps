import { describe, expect, expectTypeOf, it } from "vitest"
import type { BattleId, FactionId } from "@workspace/game-domain"

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
  battleIds: ["emperLucius-alpha-1"],
  availableUnitIds: [],
}

const baseLre = {
  id: "emperLucius",
  name: "Lucius",
  finished: false,
  eventStageStartDatesUtc: ["2026-02-01T00:00:00Z"],
  battlesCount: 0,
  constraintsCount: 0,
  regularMissions: [],
  premiumMissions: [],
  alpha: lreTrack,
  beta: lreTrack,
  gamma: lreTrack,
}

const lreCommon = {
  id: "lre-common",
  pointsMilestones: [{ milestone: 1, cumulativePoints: 100, engramPayout: 25 }],
  chestsMilestones: [{ chestLevel: 1, engramCost: 60 }],
  progression: {
    unlock: 400,
    fourStars: 120,
    fiveStars: 180,
    blueStar: 200,
    mythic: 250,
    twoBlueStars: 150,
  },
  shardsPerChest: 1,
}

const lreBattle = {
  id: "emperLucius-alpha-1",
  lreId: "emperLucius",
  track: "alpha",
  mapId: "map1",
  number: 1,
  power: 1000,
  tier: 1,
  disallowedFactions: [],
  waves: [{ round: 1, power: 500, enemies: [] }],
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
        forgeBadges: null,
        components: 1,
      },
    ])

    expect(result.success).toBe(true)
  })

  it("validates the ascension-costs ladder as its own dataset", () => {
    const result = datasetPayloadSchemas["ascension-costs"].safeParse([
      {
        progression: "Common:None",
        shards: 0,
        mythicShards: 0,
        orbs: 0,
        orbRarity: null,
      },
      {
        progression: "Uncommon:TwoStars",
        shards: 15,
        mythicShards: 0,
        orbs: 10,
        orbRarity: "Uncommon",
      },
    ])

    expect(result.success).toBe(true)
  })

  it("rejects an ascension-costs entry with an unrecognized progression step", () => {
    const result = datasetPayloadSchemas["ascension-costs"].safeParse([
      {
        progression: "NotAStep",
        shards: 0,
        mythicShards: 0,
        orbs: 0,
        orbRarity: null,
      },
    ])

    expect(result.success).toBe(false)
  })

  it("validates the unlock-shard-costs table as its own dataset", () => {
    const result = datasetPayloadSchemas["unlock-shard-costs"].safeParse([
      { rarity: "Common", shards: 40 },
      { rarity: "Mythic", shards: 1400 },
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
        abilityId: "abField",
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

  it("validates the split lres, lre-battles, and lre-common payloads", () => {
    expect(datasetPayloadSchemas.lres.safeParse([baseLre]).success).toBe(true)
    expect(
      datasetPayloadSchemas["lre-battles"].safeParse([lreBattle]).success
    ).toBe(true)
    expect(
      datasetPayloadSchemas["lre-common"].safeParse([lreCommon]).success
    ).toBe(true)
  })

  it("rejects an lre-common points milestone of the wrong type", () => {
    const result = datasetPayloadSchemas["lre-common"].safeParse([
      {
        ...lreCommon,
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
        campaignGroupId: "campaign1",
        type: "Standard",
        challenge: false,
        energyCost: 0,
        nodeNumber: 1,
        slots: 1,
        dailyAttempts: 10,
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
          groupId: "campaign1",
          faction: "Ultramarines",
          releaseType: "standard",
          coreCharacters: ["ultraTigurius"],
          types: ["Standard"],
          battleIds: ["I01"],
        },
      ]
    )

    expect(battles.success).toBe(true)
    expect(definitions.success).toBe(true)

    if (!battles.success || !definitions.success) {
      throw new Error("Expected valid campaign payloads")
    }
    expectTypeOf(battles.data[0]!.id).toEqualTypeOf<BattleId>()
    expectTypeOf(
      battles.data[0]!.enemiesFactions[0]!
    ).toEqualTypeOf<FactionId>()
    expectTypeOf(definitions.data[0]!.battleIds[0]!).toEqualTypeOf<BattleId>()
    expectTypeOf(definitions.data[0]!.faction).toEqualTypeOf<FactionId>()
  })

  it("validates an upgrade, including its recursively-nested craft recipe", () => {
    const result = datasetPayloadSchemas.upgrades.safeParse([
      {
        id: "u1",
        material: "Plasteel",
        snowprintId: "sp1",
        label: "Plasteel",
        rarity: "Rare",
        stat: "Armour",
        craftable: true,
        recipe: [
          {
            material: "Ore",
            count: 2,
            recipe: [{ material: "Rock", count: 4, recipe: null }],
          },
        ],
        farmLocations: [],
      },
    ])

    expect(result.success).toBe(true)
  })

  it("rejects an upgrade with an unrecognized rarity", () => {
    const result = datasetPayloadSchemas.upgrades.safeParse([
      {
        id: "u1",
        material: "Plasteel",
        snowprintId: "sp1",
        label: "Plasteel",
        rarity: "NotARarity",
        stat: "Armour",
        craftable: true,
        recipe: [],
        farmLocations: [],
      },
    ])

    expect(result.success).toBe(false)
  })

  it("validates a shops payload and rejects a malformed variant", () => {
    const validShop = {
      id: "guild",
      displayLocation: "guildMerchant",
      refreshWithAdWatch: true,
      allowedRefreshesPerDay: 1,
      refreshCost: { resourceType: "gems", amount: 50 },
      slots: [
        {
          variants: [
            {
              reward: { type: "shards_eldarFarseer", qty: 5 },
              unitId: "eldarFarseer",
              cost: { currency: "guildCredits", amount: 525 },
              maxPurchasesPerDay: 2,
              weight: 1,
              days: ["MON", "THU"],
            },
          ],
        },
      ],
    }

    expect(datasetPayloadSchemas.shops.safeParse([validShop]).success).toBe(
      true
    )

    const badVariant = {
      ...validShop,
      slots: [
        {
          variants: [
            {
              reward: { type: "gold", qty: 0 }, // qty must be a positive integer
              cost: { currency: "guildCredits", amount: 50 },
              maxPurchasesPerDay: 1,
              days: ["MON"],
            },
          ],
        },
      ],
    }

    expect(datasetPayloadSchemas.shops.safeParse([badVariant]).success).toBe(
      false
    )
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
