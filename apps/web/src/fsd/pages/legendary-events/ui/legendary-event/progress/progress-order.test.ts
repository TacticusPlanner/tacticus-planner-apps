import { describe, expect, it } from "vitest"

import { splitClearedBattles } from "./progress-order"

describe("splitClearedBattles", () => {
  it("lists open battles first and fully cleared ones after, each in battle order", () => {
    const battles = [
      { index: 0, complete: true },
      { index: 1, complete: false },
      { index: 2, complete: true },
      { index: 3, complete: false },
    ]
    const { open, cleared } = splitClearedBattles(battles)
    expect(open.map((battle) => battle.index)).toStrictEqual([1, 3])
    expect(cleared.map((battle) => battle.index)).toStrictEqual([0, 2])
  })
})
