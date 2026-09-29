import { describe, expect, it } from "vitest"

import type { RaidBossStatStep } from "@/entities/raid-boss"

import { buildProgressionStepLabels } from "./progression-step-labels"

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
    expect(labels[secondLegendaryIndex].rarityTierLabel).toBe("Legendary 2")

    expect(labels[labels.length - 1].rarityTierLabel).toBe("Mythic 5")
  })

  it("carries each step's total health alongside its label", () => {
    const labels = buildProgressionStepLabels(ladder)
    expect(labels[0].health).toBe(ladder[0].health)
    expect(labels[labels.length - 1].health).toBe(
      ladder[ladder.length - 1].health
    )
  })
})
