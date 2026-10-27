import { describe, expect, it } from "vitest"
import type { Alliance, Rarity, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import legendaryEventCharacters from "@/test/fixtures/legendary-event-characters.json"

import {
  defaultCollectionQuery,
  type CollectionQuery,
} from "./collection-query"
import { ascensionLadder } from "./collection-quick-filters"

import {
  buildCollectionView,
  type CollectionCatalog,
  type CollectionRoster,
  type CollectionLabels,
} from "./collection-view"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

// Real catalog characters (id, faction, alliance). The fixture carries no initial rarity, so every
// character starts Epic here except the few the tests pin explicitly.
const initialRarity: Record<string, Rarity> = { ultraCalgar: "Legendary" }
const characters = legendaryEventCharacters.map((character) => ({
  ...character,
  id: character.id as UnitId,
  alliance: character.alliance as Alliance,
  initialRarity: initialRarity[character.id] ?? "Epic",
  // Not in the fixture; the combat-filter tests build their own characters.
  rangeDistance: character.rangedHits ? 2 : null,
  movement: 3,
  shardLocations: [],
  equipmentSlots: ["I_Crit", "I_Block", "I_Defensive"],
})) as unknown as CollectionCatalog["characters"]
const mows = [
  {
    id: "ultraDreadnought" as UnitId,
    faction: "Ultramarines",
    alliance: "Imperial",
  },
  {
    id: "blackForgefiend" as UnitId,
    faction: "BlackLegion",
    alliance: "Chaos",
  },
] as CollectionCatalog["mows"]

const catalog: CollectionCatalog = {
  characters,
  mows,
  unlockShardCosts: [
    { rarity: "Epic", shards: 250 },
    { rarity: "Legendary", shards: 400 },
  ],
  equipmentRarity: new Map([["I_Crit_L001", { rarity: "Legendary" }]]),
}

const names: Record<string, string> = {
  ultraTitus: "Titus",
  ultraCalgar: "Marneus Calgar",
  ultraDreadnought: "Galatian",
  blackForgefiend: "Forgefiend",
}
const labels: CollectionLabels = {
  unitName: (_kind, id) => names[id] ?? id,
  factionName: (id) => id,
  locale: "en",
}

function character(
  unitId: string,
  overrides: Partial<PlayerCharacter> = {}
): PlayerCharacter {
  return {
    unitId: unitId as UnitId,
    progressionIndex: "Epic:RedOneStar",
    rank: "Silver1",
    xp: 0,
    xpLevel: 30,
    shards: 0,
    mythicShards: 0,
    abilities: [],
    appliedUpgradeSlots: [],
    equippedItems: [],
    ...overrides,
  }
}

function signedIn(
  roster: Partial<Extract<CollectionRoster, { state: "signedIn" }>>
): CollectionRoster {
  return {
    state: "signedIn",
    characters: undefined,
    mows: undefined,
    shards: undefined,
    ...roster,
  }
}

function findUnit(view: ReturnType<typeof buildCollectionView>, id: string) {
  return view.groups
    .flatMap((group) => group.units)
    .find((unit) => unit.unitId === id)
}

describe("buildCollectionView", () => {
  it("maps an owned character to the tile's progression data (the spec's Titus)", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", {
            progressionIndex: "Legendary:RedFourStars",
            rank: "Gold1",
            xpLevel: 45,
            shards: 120,
            mythicShards: 4,
            abilities: [
              { abilityId: "TitusActive", level: 40 },
              { abilityId: "TitusPassive", level: 38 },
            ] as PlayerCharacter["abilities"],
            equippedItems: [
              { slotId: "I_Crit", equipmentId: "I_Crit_L001", level: 10 },
              { slotId: "I_Block", equipmentId: "I_Block_L001", level: 9 },
              {
                slotId: "I_Defensive",
                equipmentId: "I_Defensive_L001",
                level: 8,
              },
            ] as PlayerCharacter["equippedItems"],
          }),
        ],
        mows: [],
        shards: [],
      }),
      labels
    )

    expect(findUnit(view, "ultraTitus")).toEqual({
      kind: "character",
      unitId: "ultraTitus",
      name: "Titus",
      data: {
        state: "owned",
        progression: "Legendary:RedFourStars",
        rank: "Gold1",
        xpLevel: 45,
        abilityLevels: [40, 38],
        equipment: [
          { equipmentId: "I_Crit_L001", rarity: "Legendary", level: 10 },
          { equipmentId: "I_Block_L001", rarity: undefined, level: 9 },
          { equipmentId: "I_Defensive_L001", rarity: undefined, level: 8 },
        ],
        shards: 120,
        mythicShards: 4,
      },
    })
  })

  it("gives an unowned character its shards toward the unlock cost of its initial rarity (Calgar 75/400)", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [],
        mows: [],
        shards: [
          { unitId: "ultraCalgar" as UnitId, amount: 75, mythicAmount: 0 },
        ],
      }),
      labels
    )

    expect(findUnit(view, "ultraCalgar")?.data).toEqual({
      state: "unowned",
      rarity: "Legendary",
      unlockShards: 400,
      shards: 75,
      mythicShards: 0,
    })
    // Synced inventory without an entry for a unit means none of its shards.
    expect(findUnit(view, "ultraTitus")?.data).toMatchObject({
      shards: 0,
      unlockShards: 250,
    })
  })

  it("gives an unowned Machine of War no rarity and no unlock target", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [],
        mows: [],
        shards: [
          { unitId: "ultraDreadnought" as UnitId, amount: 30, mythicAmount: 2 },
        ],
      }),
      labels
    )

    expect(findUnit(view, "ultraDreadnought")?.data).toEqual({
      state: "unowned",
      rarity: undefined,
      unlockShards: undefined,
      shards: 30,
      mythicShards: 2,
    })
  })

  it("puts characters and Machines of War of one faction in one group, owned first", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraCalgar", {
            progressionIndex: "Epic:RedOneStar",
            rank: "Gold1",
          }),
          character("ultraTitus", {
            progressionIndex: "Legendary:RedFourStars",
            rank: "Silver1",
          }),
        ],
        mows: [],
        shards: [],
      }),
      labels
    )

    const ultramarines = view.groups.find(
      (group) => group.factionId === "Ultramarines"
    )!
    const ids = ultramarines.units.map((unit) => unit.unitId)
    // Titus outranks Calgar on progression even though Calgar's rank is higher.
    expect(ids.slice(0, 2)).toEqual(["ultraTitus", "ultraCalgar"])
    expect(ids).toContain("ultraDreadnought")
    expect(
      ultramarines.units.slice(2).every((unit) => unit.data.state === "unowned")
    ).toBe(true)
    // Each unit appears exactly once.
    const all = view.groups.flatMap((group) =>
      group.units.map((unit) => unit.unitId)
    )
    expect(new Set(all).size).toBe(all.length)
  })

  it("orders unowned units nearest to unlock first, then units without a target", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [character("ultraTitus")],
        mows: [],
        shards: [
          // Calgar (Legendary, 400): 19%; Tigurius (Epic, 250): 80%; Galatian has no target.
          { unitId: "ultraCalgar" as UnitId, amount: 75, mythicAmount: 0 },
          { unitId: "ultraTigurius" as UnitId, amount: 200, mythicAmount: 0 },
          { unitId: "ultraDreadnought" as UnitId, amount: 90, mythicAmount: 0 },
        ],
      }),
      labels
    )

    const ids = view.groups
      .find((group) => group.factionId === "Ultramarines")!
      .units.map((unit) => unit.unitId)
    expect(ids[0]).toBe("ultraTitus")
    expect(ids.indexOf("ultraTigurius" as UnitId)).toBeLessThan(
      ids.indexOf("ultraCalgar" as UnitId)
    )
    expect(ids.at(-1)).toBe("ultraDreadnought")
  })

  it("counts owned units per faction for the card header", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [character("ultraTitus"), character("ultraCalgar")],
        mows: [],
        shards: [],
      }),
      labels
    )

    const ultramarines = view.groups.find(
      (group) => group.factionId === "Ultramarines"
    )!
    expect(ultramarines.owned).toBe(2)
    expect(view.groups.reduce((sum, group) => sum + group.owned, 0)).toBe(
      view.owned
    )
  })

  it("derives the owned summary from the groups", () => {
    const owned = characters.slice(0, 84).map((c) => character(c.id))
    const view = buildCollectionView(
      catalog,
      signedIn({ characters: owned, mows: [], shards: [] }),
      labels
    )

    expect(view.owned).toBe(84)
    expect(view.total).toBe(characters.length + mows.length)
    expect(view.total).toBe(120)
    expect(view.rosterState).toBe("available")
  })

  it("orders faction groups Imperial, then Chaos, then Xenos, by name within an alliance", () => {
    const view = buildCollectionView(catalog, { state: "anonymous" }, labels)
    const alliances = view.groups.map((group) => group.alliance)
    const firstChaos = alliances.indexOf("Chaos")
    const firstXenos = alliances.indexOf("Xenos")

    expect(alliances.lastIndexOf("Imperial")).toBeLessThan(firstChaos)
    expect(alliances.lastIndexOf("Chaos")).toBeLessThan(firstXenos)
    const imperial = view.groups
      .filter((group) => group.alliance === "Imperial")
      .map((group) => group.factionName)
    expect(imperial).toEqual(
      [...imperial].sort((a, b) => a.localeCompare(b, "en"))
    )
  })

  it.each([
    ["characters", { characters: [character("ultraTitus")], mows: undefined }],
    ["Machines of War", { characters: undefined, mows: [] }],
  ])(
    "treats the roster as not synced while only the %s chunk has synced",
    (_label, chunks) => {
      const view = buildCollectionView(
        catalog,
        signedIn({ ...chunks, shards: [] }),
        labels
      )

      // Counting a lone chunk would show every unit of the other kind as unowned.
      expect(view.rosterState).toBe("notSynced")
      expect(view.owned).toBe(0)
      expect(findUnit(view, "ultraTitus")?.data).toMatchObject({
        state: "unowned",
        shards: undefined,
      })
    }
  )

  it("shows no shard counts while the shard inventory has not synced", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({ characters: [], mows: [], shards: undefined }),
      labels
    )

    expect(findUnit(view, "ultraCalgar")?.data).toMatchObject({
      state: "unowned",
      shards: undefined,
      mythicShards: undefined,
    })
  })

  it.each<[string, CollectionRoster, string]>([
    ["anonymous", { state: "anonymous" }, "anonymous"],
    ["not synced", signedIn({}), "notSynced"],
    ["unreadable", { state: "error" }, "error"],
  ])(
    "lists every unit unowned and countless when the roster is %s",
    (_label, roster, state) => {
      const view = buildCollectionView(catalog, roster, labels)

      expect(view.rosterState).toBe(state)
      expect(view.owned).toBe(0)
      expect(view.total).toBe(120)
      const units = view.groups.flatMap((group) => group.units)
      expect(units.every((unit) => unit.data.state === "unowned")).toBe(true)
      expect(
        units.every(
          (unit) =>
            unit.data.state === "unowned" && unit.data.shards === undefined
        )
      ).toBe(true)
    }
  )

  it("keeps a mythic Machine of War's ability levels primary then secondary", () => {
    const mow = {
      unitId: "blackForgefiend" as UnitId,
      progressionIndex: "Mythic:OneBlueStar",
      xp: 0,
      xpLevel: 1,
      shards: 3,
      mythicShards: 1,
      abilities: [
        { abilityId: "primary", level: 30 },
        { abilityId: "secondary", level: 25 },
      ],
      appliedUpgradeSlots: [],
    } as unknown as PlayerMow
    const view = buildCollectionView(
      catalog,
      signedIn({ characters: [], mows: [mow], shards: [] }),
      labels
    )

    expect(findUnit(view, "blackForgefiend")?.data).toEqual({
      state: "owned",
      progression: "Mythic:OneBlueStar",
      abilityLevels: [30, 25],
      shards: 3,
      mythicShards: 1,
    })
  })
})

describe("buildCollectionView with a query", () => {
  const query = (overrides: Partial<CollectionQuery>): CollectionQuery => ({
    ...defaultCollectionQuery,
    ...overrides,
  })
  const mowRecord = (
    unitId: string,
    overrides: Partial<PlayerMow> = {}
  ): PlayerMow =>
    ({
      unitId: unitId as UnitId,
      progressionIndex: "Epic:RedOneStar",
      xp: 0,
      xpLevel: 1,
      shards: 0,
      mythicShards: 0,
      abilities: [],
      appliedUpgradeSlots: [],
      ...overrides,
    }) as unknown as PlayerMow
  const abilities = (active: number, passive: number) =>
    [
      { abilityId: "active", level: active },
      { abilityId: "passive", level: passive },
    ] as PlayerCharacter["abilities"]
  const ids = (view: ReturnType<typeof buildCollectionView>) =>
    view.groups.flatMap((group) => group.units).map((unit) => unit.unitId)
  const ultramarines = (view: ReturnType<typeof buildCollectionView>) =>
    view.groups
      .find((group) => group.factionId === "Ultramarines")
      ?.units.map((unit) => unit.unitId)

  it("sorts by rank with Machines of War after the characters (the spec's Ultramarines)", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", { rank: "Gold1" }),
          character("ultraCalgar", { rank: "Diamond1" }),
        ],
        mows: [mowRecord("ultraDreadnought")],
        shards: [],
      }),
      labels,
      query({ sort: "rank" })
    )

    expect(ultramarines(view)?.slice(0, 3)).toEqual([
      "ultraCalgar",
      "ultraTitus",
      "ultraDreadnought",
    ])
  })

  it("sorts by ability sum, breaking ties by progression", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", {
            abilities: abilities(40, 38),
            progressionIndex: "Legendary:RedFourStars",
          }),
          character("ultraCalgar", { abilities: abilities(50, 20) }),
          character("ultraTigurius", {
            abilities: abilities(45, 33),
            progressionIndex: "Epic:RedThreeStars",
          }),
        ],
        mows: [],
        shards: [],
      }),
      labels,
      query({ sort: "abilities" })
    )

    expect(ultramarines(view)?.slice(0, 3)).toEqual([
      "ultraTitus",
      "ultraTigurius",
      "ultraCalgar",
    ])
  })

  it("sorts by shards with units past one blue star first, by mythic shards", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", {
            progressionIndex: "Legendary:RedFiveStars",
            shards: 480,
          }),
          character("ultraCalgar", {
            progressionIndex: "Legendary:OneBlueStar",
            shards: 300,
            mythicShards: 12,
          }),
          character("ultraTigurius", {
            progressionIndex: "Mythic:TwoBlueStars",
            mythicShards: 40,
          }),
        ],
        mows: [],
        shards: [],
      }),
      labels,
      query({ sort: "shards" })
    )

    expect(ultramarines(view)?.slice(0, 3)).toEqual([
      "ultraTigurius",
      "ultraCalgar",
      "ultraTitus",
    ])
  })

  it.each(["rarity", "rank", "abilities", "shards"] as const)(
    "keeps owned first and unowned nearest to unlock under sort %s",
    (sort) => {
      const view = buildCollectionView(
        catalog,
        signedIn({
          characters: [character("ultraTitus")],
          mows: [],
          shards: [
            { unitId: "ultraCalgar" as UnitId, amount: 75, mythicAmount: 0 },
            {
              unitId: "ultraTigurius" as UnitId,
              amount: 200,
              mythicAmount: 0,
            },
          ],
        }),
        labels,
        query({ sort })
      )

      // Tigurius holds 200 of 250 (Epic), Calgar 75 of 400 (Legendary).
      expect(ultramarines(view)?.slice(0, 3)).toEqual([
        "ultraTitus",
        "ultraTigurius",
        "ultraCalgar",
      ])
    }
  )

  it("searches localized and catalog names ignoring case and diacritics", () => {
    const withTitusName = {
      ...catalog,
      characters: catalog.characters.map((unit) =>
        unit.id === "ultraTitus" ? { ...unit, name: "Titus" } : unit
      ),
    }
    const localized: CollectionLabels = {
      ...labels,
      unitName: (_kind, id) =>
        id === "ultraCalgar"
          ? "Marneus Calgár"
          : id === "ultraTitus"
            ? "Leutnant"
            : id,
    }

    expect(
      ids(
        buildCollectionView(
          withTitusName,
          { state: "anonymous" },
          localized,
          query({ search: "  CALGAR " })
        )
      )
    ).toEqual(["ultraCalgar"])
    expect(
      ids(
        buildCollectionView(
          withTitusName,
          { state: "anonymous" },
          localized,
          query({ search: "titus" })
        )
      )
    ).toEqual(["ultraTitus"])
  })

  it("combines filters: Imperial, Legendary and Machines of War lists only owned Legendary Imperial Machines of War", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", {
            progressionIndex: "Legendary:RedFourStars",
          }),
        ],
        mows: [
          mowRecord("ultraDreadnought", {
            progressionIndex: "Legendary:RedThreeStars",
          }),
          mowRecord("blackForgefiend", {
            progressionIndex: "Legendary:RedThreeStars",
          }),
        ],
        shards: [],
      }),
      labels,
      query({ alliance: "Imperial", rarities: ["Legendary"], kind: "mow" })
    )

    expect(ids(view)).toEqual(["ultraDreadnought"])
    expect(view).toMatchObject({ owned: 1, total: 1, filtered: true })
  })

  it("matches an unowned character's starting rarity and never an unowned Machine of War", () => {
    const view = buildCollectionView(
      catalog,
      { state: "anonymous" },
      labels,
      query({ rarities: ["Legendary"] })
    )

    expect(ids(view)).toEqual(["ultraCalgar"])
  })

  it("rank range lists only owned characters inside it", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", { rank: "Gold1" }),
          character("ultraCalgar", { rank: "Diamond3" }),
          character("ultraTigurius", { rank: "Silver3" }),
        ],
        mows: [mowRecord("ultraDreadnought")],
        shards: [],
      }),
      labels,
      query({ rankMin: "Gold1", rankMax: "Diamond3" })
    )

    expect(ids(view)).toEqual(["ultraCalgar", "ultraTitus"])
  })

  it("reads a rank range set backwards as the ranks between its ends", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [
          character("ultraTitus", { rank: "Gold1" }),
          character("ultraCalgar", { rank: "Diamond3" }),
          character("ultraTigurius", { rank: "Silver3" }),
        ],
        mows: [mowRecord("ultraDreadnought")],
        shards: [],
      }),
      labels,
      query({ rankMin: "Diamond3", rankMax: "Gold1" })
    )

    expect(ids(view)).toEqual(["ultraCalgar", "ultraTitus"])
  })

  it("hides factions without a match and counts only matching units", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({ characters: [character("ultraTitus")], mows: [], shards: [] }),
      labels,
      query({ factions: ["Ultramarines"] })
    )

    expect(view.groups.map((group) => group.factionId)).toEqual([
      "Ultramarines",
    ])
    expect(view.groups[0]).toMatchObject({ owned: 1 })
    expect(view).toMatchObject({ owned: 1, total: 7, filtered: true })
  })

  it("lists nothing when no unit matches", () => {
    const view = buildCollectionView(
      catalog,
      { state: "anonymous" },
      labels,
      query({ search: "no such unit" })
    )

    expect(view).toMatchObject({
      groups: [],
      owned: 0,
      total: 0,
      filtered: true,
    })
  })

  it("filters by ownership", () => {
    const roster = signedIn({
      characters: [character("ultraTitus")],
      mows: [],
      shards: [],
    })

    expect(
      buildCollectionView(
        catalog,
        roster,
        labels,
        query({ ownership: "owned" })
      ).total
    ).toBe(1)
    expect(
      buildCollectionView(
        catalog,
        roster,
        labels,
        query({ ownership: "unowned" })
      ).total
    ).toBe(119)
  })

  it("ignores rank range, ownership and quick filters without a roster", () => {
    const view = buildCollectionView(
      catalog,
      { state: "anonymous" },
      labels,
      query({
        alliance: "Imperial",
        quick: "canAscend",
        rankMin: "Gold1",
        ownership: "owned",
      })
    )

    expect(view.total).toBeGreaterThan(0)
    expect(view.groups.every((group) => group.alliance === "Imperial")).toBe(
      true
    )
    expect(view.query).toMatchObject({
      alliance: "Imperial",
      quick: null,
      rankMin: null,
      ownership: null,
    })
  })

  it("applies quick filters to owned units only", () => {
    const ladder = ascensionLadder([
      {
        id: "a",
        progression: "Epic:RedTwoStars",
        shards: 65,
        mythicShards: 0,
        orbs: 0,
        orbRarity: null,
      },
      {
        id: "b",
        progression: "Epic:RedThreeStars",
        shards: 85,
        mythicShards: 0,
        orbs: 0,
        orbRarity: null,
      },
      {
        id: "c",
        progression: "Legendary:RedThreeStars",
        shards: 100,
        mythicShards: 0,
        orbs: 10,
        orbRarity: "Legendary",
      },
    ] as Parameters<typeof ascensionLadder>[0])
    const roster = signedIn({
      characters: [
        character("ultraTitus", { shards: 260 }),
        character("ultraTigurius", { rank: "Gold1" }),
      ],
      mows: [],
      shards: [
        { unitId: "ultraCalgar" as UnitId, amount: 5000, mythicAmount: 0 },
      ],
    })
    const orbs = {
      imperial: [{ rarity: "Legendary" as const, amount: 10 }],
      chaos: [],
      xenos: [],
    }
    const view = (
      quick: CollectionQuery["quick"],
      extras?: Parameters<typeof buildCollectionView>[4]
    ) =>
      ids(
        buildCollectionView(catalog, roster, labels, query({ quick }), extras)
      )

    expect(view("canAscend", { ladder, orbs })).toEqual(["ultraTitus"])
    expect(view("canAscend", { ladder })).toEqual([])
    expect(view("needToAscend")).toEqual(["ultraTigurius"])
    expect(
      view("readyToRankUp", {
        rankUpReady: new Set(["ultraTitus", "ultraCalgar"]),
      })
    ).toEqual(["ultraTitus"])
  })
})

describe("buildCollectionView combat filters", () => {
  type CatalogCharacter = CollectionCatalog["characters"][number]
  const unit = (
    id: string,
    overrides: Partial<CatalogCharacter> = {}
  ): CatalogCharacter =>
    ({
      id: id as UnitId,
      name: id,
      faction: "Ultramarines",
      alliance: "Imperial",
      initialRarity: "Epic",
      meleeDamage: "Physical",
      meleeHits: 1,
      rangedDamage: null,
      rangedHits: null,
      rangeDistance: null,
      movement: 3,
      traits: [],
      activeAbilityDamage: [],
      passiveAbilityDamage: [],
      shardLocations: [],
      equipmentSlots: ["I_Crit", "I_Block", "I_Defensive"],
      ...overrides,
    }) as CatalogCharacter
  const location = (type: string, isMythic = false) =>
    ({ type, isMythic }) as CatalogCharacter["shardLocations"][number]

  const listed = (
    units: CatalogCharacter[],
    overrides: Partial<CollectionQuery>,
    roster: CollectionRoster = { state: "anonymous" }
  ) =>
    buildCollectionView({ ...catalog, characters: units }, roster, labels, {
      ...defaultCollectionQuery,
      ...overrides,
    })
      .groups.flatMap((group) => group.units)
      .filter((tile) => tile.kind === "character")
      .map((tile) => tile.unitId)
      .sort()

  it("reads hits per the attack type, either count without one", () => {
    const units = [
      unit("a", { meleeHits: 4 }),
      unit("b", {
        meleeHits: 1,
        rangedHits: 3,
        rangedDamage: "Bolter",
        rangeDistance: 2,
      }),
    ]
    expect(listed(units, { hitsMin: 3, hitsMax: 4 })).toEqual(["a", "b"])
    expect(listed(units, { hitsMin: 3, hitsMax: 4, attack: "ranged" })).toEqual(
      ["b"]
    )
    expect(listed(units, { attack: "melee" })).toEqual(["a"])
    // A backwards hits range is read with its ends swapped.
    expect(listed(units, { hitsMin: 4, hitsMax: 3 })).toEqual(["a", "b"])
  })

  it("needs every picked damage type and trait", () => {
    const units = [
      unit("a", {
        meleeDamage: "Bolter",
        activeAbilityDamage: ["Psychic"],
        traits: ["Psyker", "Flying"],
      }),
      unit("b", { meleeDamage: "Bolter", traits: ["Psyker"] }),
    ]
    expect(listed(units, { damageTypes: ["Bolter", "Psychic"] })).toEqual(["a"])
    expect(listed(units, { traits: ["Psyker", "Flying"] })).toEqual(["a"])
    expect(listed(units, { damageTypes: ["Bolter"] })).toEqual(["a", "b"])
  })

  it("matches Mechanical on Living Metal", () => {
    const units = [
      unit("necron", { traits: ["LivingMetal"] }),
      unit("marine", { traits: ["Resilient"] }),
    ]
    expect(listed(units, { traits: ["Mechanical"] })).toEqual(["necron"])
  })

  it("matches movement exactly and range only for ranged characters", () => {
    const units = [
      unit("a", { movement: 4 }),
      unit("b", { rangedHits: 2, rangedDamage: "Las", rangeDistance: 3 }),
    ]
    expect(listed(units, { movement: 4 })).toEqual(["a"])
    expect(listed(units, { rangeMin: 2, rangeMax: 3 })).toEqual(["b"])
  })

  it("matches any picked shard source, or none", () => {
    const units = [
      unit("a", {
        shardLocations: [location("Elite"), location("Mirror")],
      }),
      unit("b"),
      unit("c", { shardLocations: [location("Extremis", true)] }),
    ]
    expect(listed(units, { shardSources: ["Mirror"] })).toEqual(["a"])
    expect(listed(units, { shardSources: ["Standard", "Elite"] })).toEqual([
      "a",
    ])
    // Mythic shard locations do not count as a source.
    expect(listed(units, { shardSources: ["none"] })).toEqual(["b", "c"])
  })

  it("applies signed out and leaves out Machines of War", () => {
    const view = buildCollectionView(
      { ...catalog, characters: [unit("a")] },
      { state: "anonymous" },
      labels,
      { ...defaultCollectionQuery, attack: "melee" }
    )
    expect(view.groups.flatMap((group) => group.units)).toEqual([
      expect.objectContaining({ unitId: "a", kind: "character" }),
    ])
    expect(view.query.attack).toBe("melee")
  })

  it("lists only owned units in a stars range, ends swapped when backwards", () => {
    const roster = signedIn({
      characters: [
        character("a", { progressionIndex: "Legendary:RedThreeStars" }),
        character("b", { progressionIndex: "Epic:RedThreeStars" }),
      ],
      mows: [],
      shards: [],
    })
    const units = [unit("a"), unit("b"), unit("c")]
    const range = {
      starsMin: "Legendary:RedFiveStars" as const,
      starsMax: "Legendary:RedThreeStars" as const,
    }
    expect(listed(units, range, roster)).toEqual(["a"])
    // Without a roster the stars range does not apply.
    expect(listed(units, range)).toEqual(["a", "b", "c"])
  })

  it("selects Missing equipment and Abilities behind level", () => {
    const roster = signedIn({
      characters: [
        character("a", {
          xpLevel: 45,
          abilities: [
            { abilityId: "a1", level: 45 },
            { abilityId: "a2", level: 40 },
          ] as PlayerCharacter["abilities"],
          equippedItems: [
            { slotId: "Slot1", equipmentId: "I_Crit_L001", level: 1 },
            { slotId: "Slot2", equipmentId: "I_Block_L001", level: 1 },
          ] as PlayerCharacter["equippedItems"],
        }),
        character("b", {
          xpLevel: 30,
          abilities: [
            { abilityId: "b1", level: 30 },
            { abilityId: "b2", level: 30 },
          ] as PlayerCharacter["abilities"],
          equippedItems: [
            { slotId: "Slot1", equipmentId: "I_Crit_L001", level: 1 },
            { slotId: "Slot2", equipmentId: "I_Block_L001", level: 1 },
            { slotId: "Slot3", equipmentId: "I_Defensive_L001", level: 1 },
          ] as PlayerCharacter["equippedItems"],
        }),
      ],
      mows: [],
      shards: [],
    })
    const units = [unit("a"), unit("b")]
    expect(listed(units, { quick: "missingEquipment" }, roster)).toEqual(["a"])
    expect(listed(units, { quick: "abilitiesBehindLevel" }, roster)).toEqual([
      "a",
    ])
  })
})
