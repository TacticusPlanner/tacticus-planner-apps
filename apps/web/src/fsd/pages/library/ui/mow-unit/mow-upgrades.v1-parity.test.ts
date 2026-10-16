import { describe, expect, it } from "vitest"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import fixture from "./v1-mow-lookup.fixture.json"
import {
  calculateMowUpgrades,
  type MowCostRung,
  type MowLevelRanges,
} from "./mow-upgrades.model"

// Expected numbers come from V1's MoW Lookup (MowsService.getMaterialsList + MowLookupService) run over
// V1's own data; its cost ladder and these three MoWs' recipes equal V2's catalog.
const costsByLevel = new Map<number, MowCostRung>(
  (fixture.costs as MowCostRung[]).map((rung) => [rung.level, rung])
)
const upgradesById = new Map<UpgradeId, UpgradeWithFarmLocations>(
  Object.entries(fixture.upgrades).map(([id, upgrade]) => [
    id as UpgradeId,
    {
      id: id as UpgradeId,
      label: id,
      rarity: upgrade.rarity as Rarity,
      stat: "",
      crafted: upgrade.crafted,
      recipe: upgrade.recipe.map((entry) => ({
        material: entry.material as UpgradeId,
        count: entry.count,
      })),
      farmLocations: [],
    },
  ])
)
const mows = fixture.mows as unknown as Record<
  string,
  { primary: UpgradeId[][]; secondary: UpgradeId[][] }
>

describe("Ability upgrades matches V1's MoW Lookup", () => {
  it.each(
    fixture.cases.map((entry) => [
      `${entry.mowId} P ${entry.ranges.primary.from}→${entry.ranges.primary.to}, S ${entry.ranges.secondary.from}→${entry.ranges.secondary.to}`,
      entry,
    ])
  )("%s", (_, entry) => {
    const result = calculateMowUpgrades({
      recipes: mows[entry.mowId]!,
      costsByLevel,
      upgradesById,
      ranges: entry.ranges as MowLevelRanges,
    })

    expect(result.needed).toEqual({
      gold: entry.expected.gold,
      salvage: entry.expected.salvage,
      components: entry.expected.components,
      badges: entry.expected.badges,
      forgeBadges: entry.expected.forgeBadges,
    })
    expect(
      Object.fromEntries(
        result.materials
          .map((line) => [line.id, line.needed] as const)
          .sort(([a], [b]) => a.localeCompare(b))
      )
    ).toEqual(entry.expected.materials)
  })
})
