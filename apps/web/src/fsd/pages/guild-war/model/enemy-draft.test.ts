import { describe, expect, it } from "vitest"

import { enemyFields } from "./enemy-draft"

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
