import { describe, expect, it } from "vitest"

import type {
  PlanSpareUpgrade,
  PlanUpgradeMaterial,
} from "@/features/goal-planning"

import { upgradeRowsByRarity } from "./insights-materials-view"

const material = (
  id: string,
  rarity: string,
  required: number,
  missing: number,
  days = 0,
  energy = 0
): PlanUpgradeMaterial =>
  ({
    id,
    label: id,
    rarity,
    required,
    missing,
    days,
    energyToClear: energy,
    goalIds: ["g1"],
  }) as PlanUpgradeMaterial
const upgrades = [
  material("plasma", "Epic", 6, 6, 4.2, 900.4),
  material("purity", "Common", 40, 12, 2.5, 420),
  material("seal", "Common", 10, 0),
]
const spare = [
  { id: "auspex", label: "auspex", rarity: "Rare", spare: 7 },
] as PlanSpareUpgrade[]

describe("upgradeRowsByRarity", () => {
  it("Missing lists only what is still missing, with the days and energy left", () => {
    expect(upgradeRowsByRarity("missing", upgrades, spare)).toEqual([
      {
        rarity: "Epic",
        rows: [
          {
            id: "plasma",
            label: "plasma",
            rarity: "Epic",
            count: 6,
            missing: undefined,
            cost: { days: 5, energy: 900 },
            goalIds: ["g1"],
          },
        ],
      },
      {
        rarity: "Common",
        rows: [expect.objectContaining({ id: "purity", count: 12 })],
      },
    ])
  })

  it("Required lists every needed upgrade, with how many are still missing", () => {
    const common = upgradeRowsByRarity("required", upgrades, spare).at(-1)
    expect(common?.rows).toEqual([
      expect.objectContaining({ id: "purity", count: 40, missing: 12 }),
      expect.objectContaining({
        id: "seal",
        count: 10,
        missing: 0,
        cost: undefined,
      }),
    ])
  })

  it("Spare lists the spare upgrades with no farming", () => {
    expect(upgradeRowsByRarity("spare", upgrades, spare)).toEqual([
      {
        rarity: "Rare",
        rows: [
          {
            id: "auspex",
            label: "auspex",
            rarity: "Rare",
            count: 7,
            goalIds: [],
          },
        ],
      },
    ])
  })
})
