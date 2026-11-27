import type { Rarity } from "@workspace/game-domain"

import { normalizeXpBookRarity } from "@/entities/planning-setting"
import type {
  AbilityMaterials,
  GoalInventoryAllocation,
  LevelRules,
} from "@/entities/goal-farming"

import type {
  ItemNeed,
  PlanMissingResources,
  PlanResourceNeeds,
} from "./use-plan-insights.domain"

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

/** Adds `need` (gross) and `short` (left after stock) to one item's entry. */
function addNeed<K extends string>(
  target: Partial<Record<K, ItemNeed>>,
  key: K,
  need: number,
  short: number
) {
  if (need <= 0 && short <= 0) return
  const entry = (target[key] ??= { need: 0, short: 0 })
  entry.need += Math.max(0, need)
  entry.short += Math.max(0, short)
}

/** What a goal's Ability materials still lack once the plan's stock is spent: the entry keeps its gross
 *  need beside the stock at its turn (an entry without stock, from a plan run without inventory, is
 *  counted whole). */
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
 *  scoped goal's ability badges, orbs, forge badges, MoW components, level XP and gold left after the
 *  account's stock is spent in priority order. Badges, orbs and components are split by alliance.
 *  The same pass keeps each item's gross need beside its shortfall (`needs`, Inventory's have / need),
 *  so the two pages can never disagree. */
export function createPlanMissingResources() {
  const needs: PlanResourceNeeds = {
    abilityBadges: {},
    orbs: {},
    forgeBadges: {},
    components: {},
    xp: { need: 0, short: 0 },
  }
  const missing: PlanMissingResources = {
    abilityBadges: {},
    orbs: {},
    forgeBadges: {},
    components: {},
    xp: 0,
    xpBooks: null,
    gold: 0,
  }

  const addAbilityMaterials = (
    materials: AbilityMaterials | null | undefined,
    alliance: string | undefined
  ) => {
    if (!materials || !alliance) return
    const { available } = materials
    const badges = (missing.abilityBadges[alliance] ??= {})
    const badgeNeeds = (needs.abilityBadges[alliance] ??= {})
    for (const [rarity, count] of shortfall(
      materials.badgesByRarity,
      available?.badgesByRarity
    )) {
      addTo(badges, rarity, count)
      addNeed(badgeNeeds, rarity, materials.badgesByRarity[rarity] ?? 0, count)
    }
    for (const [rarity, count] of shortfall(
      materials.forgeBadgesByRarity,
      available?.forgeBadgesByRarity
    )) {
      addTo(missing.forgeBadges, rarity, count)
      addNeed(
        needs.forgeBadges,
        rarity,
        materials.forgeBadgesByRarity[rarity] ?? 0,
        count
      )
    }
    const componentsShort = materials.components - (available?.components ?? 0)
    addTo(missing.components, alliance, componentsShort)
    addNeed(needs.components, alliance, materials.components, componentsShort)
    if (Object.keys(badgeNeeds).length === 0)
      delete needs.abilityBadges[alliance]
    if (Object.keys(badges).length === 0) delete missing.abilityBadges[alliance]
  }

  const addOrbAllocation = (
    allocation: GoalInventoryAllocation<string> | undefined
  ) => {
    const stage = allocation?.stages[0]
    const left = new Map(
      (stage?.remaining ?? []).map((need) => [need.id, need.count])
    )
    for (const need of stage?.needs ?? []) {
      // `orb:<alliance>:<rarity>` (orb-potential-allocation.ts).
      const [, key, rarity] = need.id.split(":", 3)
      const alliance = key ? ALLIANCE_BY_KEY[key] : undefined
      if (!alliance || !rarity) continue
      const short = left.get(need.id) ?? 0
      addNeed(
        (needs.orbs[alliance] ??= {}),
        rarity as Rarity,
        need.count,
        short
      )
    }
    for (const need of stage?.remaining ?? []) {
      const [, key, rarity] = need.id.split(":", 3)
      const alliance = key ? ALLIANCE_BY_KEY[key] : undefined
      if (!alliance || !rarity || need.count <= 0) continue
      addTo((missing.orbs[alliance] ??= {}), rarity as Rarity, need.count)
    }
  }

  /** `remainingXp` is what the owned books leave uncovered; `chargedXp` the goal's whole level-XP
   *  interval (its gross need), the remainder when omitted. */
  const addXp = (
    remainingXp: number | undefined,
    chargedXp: number | undefined = remainingXp
  ) => {
    missing.xp += Math.max(0, remainingXp ?? 0)
    needs.xp.need += Math.max(0, chargedXp ?? 0)
    needs.xp.short += Math.max(0, remainingXp ?? 0)
  }

  const addGold = (gold: number | undefined) => {
    missing.gold += Math.max(0, gold ?? 0)
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

  return {
    addAbilityMaterials,
    addOrbAllocation,
    addXp,
    addGold,
    resolve,
    needs: () => needs,
  }
}
