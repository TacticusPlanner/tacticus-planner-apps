import type { Rarity } from "@workspace/game-domain"

import { normalizeXpBookRarity } from "@/entities/planning-setting"
import type {
  AbilityMaterials,
  GoalInventoryAllocation,
  LevelRules,
} from "@/features/goal-farming/@x/goal-planning"

import type { PlanMissingResources } from "./use-plan-insights.domain"

const ALLIANCE_BY_KEY: Record<string, string> = {
  imperial: "Imperial",
  xenos: "Xenos",
  chaos: "Chaos",
}

function addTo<K extends string>(
  target: Partial<Record<K, number>>,
  key: K,
  count: number
) {
  if (count <= 0) return
  target[key] = (target[key] ?? 0) + count
}

/** What a goal's Ability materials still lack once the plan's stock is spent: a Character's entry is
 *  already net, a Machine of War's keeps its gross need beside the stock at its turn. */
function shortfall(
  needed: Partial<Record<Rarity, number>>,
  available: Partial<Record<Rarity, number>> | undefined
) {
  return (Object.entries(needed) as [Rarity, number][]).map(
    ([rarity, count]) =>
      [rarity, Math.max(0, count - (available?.[rarity] ?? 0))] as const
  )
}

/** The plan-wide "still missing" totals for the Insights view (V1's "Total Resources Missing"): every
 *  scoped goal's ability badges, orbs, forge badges, MoW components and level XP left after the
 *  account's stock is spent in priority order. Badges, orbs and components are split by alliance. */
export function createPlanMissingResources() {
  const missing: PlanMissingResources = {
    abilityBadges: {},
    orbs: {},
    forgeBadges: {},
    components: {},
    xp: 0,
    xpBooks: null,
  }

  const addAbilityMaterials = (
    materials: AbilityMaterials | null | undefined,
    alliance: string | undefined
  ) => {
    if (!materials || !alliance) return
    const { available } = materials
    const badges = (missing.abilityBadges[alliance] ??= {})
    for (const [rarity, count] of shortfall(
      materials.badgesByRarity,
      available?.badgesByRarity
    )) {
      addTo(badges, rarity, count)
    }
    for (const [rarity, count] of shortfall(
      materials.forgeBadgesByRarity,
      available?.forgeBadgesByRarity
    )) {
      addTo(missing.forgeBadges, rarity, count)
    }
    addTo(
      missing.components,
      alliance,
      materials.components - (available?.components ?? 0)
    )
    if (Object.keys(badges).length === 0) delete missing.abilityBadges[alliance]
  }

  const addOrbAllocation = (
    allocation: GoalInventoryAllocation<string> | undefined
  ) => {
    for (const need of allocation?.stages[0]?.remaining ?? []) {
      // `orb:<alliance>:<rarity>` (orb-potential-allocation.ts).
      const [, key, rarity] = need.id.split(":")
      const alliance = key ? ALLIANCE_BY_KEY[key] : undefined
      if (!alliance || !rarity || need.count <= 0) continue
      addTo((missing.orbs[alliance] ??= {}), rarity as Rarity, need.count)
    }
  }

  const addXp = (remainingXp: number | undefined) => {
    missing.xp += Math.max(0, remainingXp ?? 0)
  }

  /** The totals, with the missing XP priced in books of the selected rarity. */
  const resolve = (
    levelRules: LevelRules | undefined,
    xpBookRarity: string | null | undefined
  ): PlanMissingResources => {
    if (!levelRules) return missing
    const rarity = normalizeXpBookRarity(xpBookRarity)
    return {
      ...missing,
      xpBooks: {
        rarity,
        count: Math.ceil(missing.xp / levelRules.xpBooks[rarity].xp),
      },
    }
  }

  return { addAbilityMaterials, addOrbAllocation, addXp, resolve }
}
