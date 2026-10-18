import { describe, expect, it } from "vitest"

import { npcRecord, statRow } from "./npc-fixtures"
import { resolveLadderRow } from "./resolve-ladder-row"

// Grot's served ladder starts rank 0/0, rank 1/0, rank 1/1, rank 2/1 (health 69), rank 3/1 (health 86).
const grot = npcRecord("orksNpc1Grot", "Grot", {
  stats: [
    statRow(0, 0, 40),
    statRow(1, 0, 50),
    statRow(1, 1, 55),
    statRow(2, 1, 69, { damage: 35, armour: 0 }),
    statRow(3, 1, 86),
  ],
})

describe("resolveLadderRow", () => {
  it("reads a 1-based ladder index as the row before it", () => {
    expect(resolveLadderRow(grot, 4)).toEqual({
      servedIndex: 3,
      row: statRow(2, 1, 69, { damage: 35, armour: 0 }),
    })
    expect(resolveLadderRow(grot, 5)?.row.rank).toBe(3)
  })

  it("reads 0 or less as the first row, as V1 did", () => {
    expect(resolveLadderRow(grot, 0)?.servedIndex).toBe(0)
    expect(resolveLadderRow(grot, -2)?.servedIndex).toBe(0)
  })

  it("is undefined past the end of the ladder", () => {
    const helbrecht = npcRecord("templBossHelbrecht", "Helbrecht", {
      stats: [statRow(10, 5), statRow(11, 6)],
    })
    expect(resolveLadderRow(helbrecht, 3)).toBeUndefined()
  })

  it("is undefined for an unknown NPC", () => {
    expect(resolveLadderRow(undefined, 1)).toBeUndefined()
  })
})
