import { describe, expect, it } from "vitest"

import type { RaidBossStatStep } from "@/entities/raid-boss"

import { buildProgressionStepLabels } from "./progression-step-labels"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

// Shape mirrors a real Tervigon ladder (Common 1-4, Uncommon 1-3, Rare 1-3, Epic 1-3,
// Legendary 1-5, Mythic 1-5) — contiguous rarity groups, per design.md's risk note.
const rarityCounts: [string, number][] = [
  ["Common", 4],
  ["Uncommon", 3],
  ["Rare", 3],
  ["Epic", 3],
  ["Legendary", 5],
  ["Mythic", 5],
]

const ladder: RaidBossStatStep[] = rarityCounts.flatMap(([baseRarity, count]) =>
  Array.from({ length: count }, (_, i) => ({
    baseRarity,
    health: 1_000_000 * (i + 1),
  }))
) as unknown as RaidBossStatStep[]

describe("buildProgressionStepLabels", () => {
  it("labels the second Legendary step and the last (fifth) Mythic step", () => {
    const labels = buildProgressionStepLabels(ladder)

    const secondLegendaryIndex = ladder.findIndex(
      (entry, index) =>
        entry.baseRarity === "Legendary" &&
        ladder.slice(0, index + 1).filter((e) => e.baseRarity === "Legendary")
          .length === 2
    )
    expect(at(labels, secondLegendaryIndex)).toMatchObject({
      rarity: "Legendary",
      tierIndex: 2,
    })

    expect(at(labels, labels.length - 1)).toMatchObject({
      rarity: "Mythic",
      tierIndex: 5,
    })
  })

  it("leaves an unknown rarity token unresolved", () => {
    const [label] = buildProgressionStepLabels([
      { baseRarity: "Shiny", health: 1 },
    ] as unknown as RaidBossStatStep[])
    expect(label).toMatchObject({ rarity: null, tierIndex: 1 })
  })

  it("carries each step's total health alongside its label", () => {
    const labels = buildProgressionStepLabels(ladder)
    expect(at(labels, 0).health).toBe(at(ladder, 0).health)
    expect(at(labels, labels.length - 1).health).toBe(
      at(ladder, ladder.length - 1).health
    )
  })
})
