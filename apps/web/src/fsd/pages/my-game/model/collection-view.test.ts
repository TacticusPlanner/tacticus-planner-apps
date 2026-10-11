import { describe, expect, it } from "vitest"
import type { Alliance, Rarity, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import legendaryEventCharacters from "@/test/fixtures/legendary-event-characters.json"

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
  id: character.id as UnitId,
  faction: character.faction,
  alliance: character.alliance as Alliance,
  initialRarity: initialRarity[character.id] ?? ("Epic" as Rarity),
})) as CollectionCatalog["characters"]
const mows = [
  {
    id: "ultraDreadnought" as UnitId,
    faction: "Ultramarines",
    alliance: "Imperial" as Alliance,
  },
  {
    id: "blackForgefiend" as UnitId,
    faction: "BlackLegion",
    alliance: "Chaos" as Alliance,
  },
] as CollectionCatalog["mows"]

const catalog: CollectionCatalog = {
  characters,
  mows,
  unlockShardCosts: [
    { rarity: "Epic", shards: 250 },
    { rarity: "Legendary", shards: 400 },
  ],
  equipmentRarity: new Map([
    ["I_Crit_L001", { rarity: "Legendary" as Rarity }],
  ]),
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
  } as PlayerCharacter
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

  it("treats Machines of War as unowned while only the characters chunk has synced", () => {
    const view = buildCollectionView(
      catalog,
      signedIn({
        characters: [character("ultraTitus")],
        mows: undefined,
        shards: [],
      }),
      labels
    )

    expect(view.rosterState).toBe("available")
    expect(findUnit(view, "ultraDreadnought")?.data.state).toBe("unowned")
  })

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
