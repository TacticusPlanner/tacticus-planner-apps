import { describe, expect, it } from "vitest"

import {
  EMPTY_ENEMY,
  capEnemy,
  enemyFields,
  enemyRanks,
  enemyRarities,
} from "./enemy-draft"

describe("enemyFields", () => {
  it("is null when nothing was entered", () => {
    expect(
      enemyFields({ characters: [], mow: null, buffIds: [], boardId: null })
    ).toBeNull()
  })

  it("drops a stored outcome from the Machine of War and keeps the characters'", () => {
    const fields = enemyFields({
      characters: [
        {
          unitId: "ultraTitus",
          rarity: "Epic",
          rank: "Gold1",
          state: "killed",
        },
      ],
      mow: {
        unitId: "adeptRhino",
        rarity: "Epic",
        rank: null,
        state: "killed",
      },
      buffIds: [],
      boardId: null,
    } as never)
    expect(fields?.mow?.state).toBeNull()
    expect(fields?.characters[0]?.state).toBe("killed")
  })
})

describe("enemy options under the defenders' cap", () => {
  it("offers no rarity above the cap", () => {
    expect(enemyRarities("Rare")).toEqual(["Common", "Uncommon", "Rare"])
    expect(enemyRarities(undefined)).toHaveLength(6)
  })

  it("offers no rank above the cap's, nor above the enemy's own lower rarity", () => {
    expect(enemyRanks("Rare", null).at(-1)).toBe("Silver1")
    expect(enemyRanks("Rare", "Uncommon").at(-1)).toBe("Bronze1")
    expect(enemyRanks(undefined, null).at(-1)).toBe("Adamantine2")
  })

  it("brings noted enemies down when the cap is lowered", () => {
    const draft = capEnemy(
      {
        ...EMPTY_ENEMY,
        characters: [
          {
            unitId: "ultraTitus",
            rarity: "Legendary",
            rank: "Diamond3",
            state: "killed",
          },
          { unitId: "ultraCalgar", rarity: null, rank: "Stone2", state: null },
        ],
        mow: {
          unitId: "adeptRhino",
          rarity: "Legendary",
          rank: null,
          state: null,
        },
      },
      "Epic"
    )
    expect(draft.characters).toEqual([
      { unitId: "ultraTitus", rarity: "Epic", rank: "Gold1", state: "killed" },
      { unitId: "ultraCalgar", rarity: null, rank: "Stone2", state: null },
    ])
    expect(draft.mow?.rarity).toBe("Epic")
  })
})
