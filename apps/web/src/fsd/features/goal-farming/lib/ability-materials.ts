import type {
  CharacterAbilityCostStorageModel,
  MowUpgradeCostStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

/** Gold, ability badges, forge badges and components still needed to raise a unit's ability tracks,
 *  summed from a per-level cost ladder over the transitions no higher-priority goal already covers. */
export type AbilityMaterials = {
  gold: number
  badgesByRarity: Partial<Record<Rarity, number>>
  forgeBadgesByRarity: Partial<Record<Rarity, number>>
  components: number
  /** Machine of War only: the stock available at the goal's turn (before it consumes), for the
   *  needed rarities and components; uncapped. Set by the plan allocator, absent on a raw need. */
  available?: {
    badgesByRarity: Partial<Record<Rarity, number>>
    forgeBadgesByRarity: Partial<Record<Rarity, number>>
    components: number
  }
}

type CoveredTransitions = { primary: Set<number>; secondary: Set<number> }

// A Character rung has no forge badges or components; a MoW rung has both.
type LadderRung = Pick<CharacterAbilityCostStorageModel, "gold" | "badges"> &
  Partial<Pick<MowUpgradeCostStorageModel, "forgeBadges" | "components">>

/** Source levels whose transition (L -> L + 1) is still uncovered: not yet reached by the player and
 *  not claimed by a higher-priority goal. The same filter `uncoveredMowAbilityUpgradeIds` applies.
 *  Claims the levels in `covered` when `claim` is set. */
function uncoveredAbilityLevels(
  start: number,
  end: number,
  current: number,
  covered: Set<number>,
  claim: boolean
): number[] {
  const levels: number[] = []
  for (let level = Math.max(start, current); level < end; level++) {
    if (covered.has(level)) continue
    if (claim) covered.add(level)
    levels.push(level)
  }
  return levels
}

/**
 * The ability materials for a MoW or Character Ability goal, or `null` when there is nothing to
 * sum (no ability target, no ladder loaded, or every transition already covered/reached).
 * `ladder` is keyed by the level a rung raises an ability to (the ladder starts at level 2).
 *
 * A MoW passes `claim: false`: `abilityResourceNeed` claims the same transitions right after, so this
 * must be computed first and must not consume them. A Character has no upgrade-need sibling, so it
 * passes `claim: true` to make lower-priority goals for the same unit skip these levels.
 */
export function abilityMaterialsNeed(params: {
  detail: GoalDetail
  ladder: ReadonlyMap<number, LadderRung> | undefined
  currentLevels: { primary: number; secondary: number }
  covered: CoveredTransitions
  claim: boolean
}): AbilityMaterials | null {
  const target = params.detail.config.ability
  if (!target || !params.ladder || params.ladder.size === 0) return null

  const materials: AbilityMaterials = {
    gold: 0,
    badgesByRarity: {},
    forgeBadgesByRarity: {},
    components: 0,
  }
  const tracks = [
    ["primary", target.activeStart, target.activeEnd],
    ["secondary", target.passiveStart, target.passiveEnd],
  ] as const
  for (const [track, start, end] of tracks) {
    for (const level of uncoveredAbilityLevels(
      start,
      end,
      params.currentLevels[track],
      params.covered[track],
      params.claim
    )) {
      const rung = params.ladder.get(level + 1)
      if (!rung) continue
      materials.gold += rung.gold
      addRarity(materials.badgesByRarity, rung.badges)
      if (rung.forgeBadges) {
        addRarity(materials.forgeBadgesByRarity, rung.forgeBadges)
      }
      materials.components += rung.components ?? 0
    }
  }

  const empty =
    materials.gold === 0 &&
    materials.components === 0 &&
    Object.keys(materials.badgesByRarity).length === 0 &&
    Object.keys(materials.forgeBadgesByRarity).length === 0
  return empty ? null : materials
}

function addRarity(
  into: Partial<Record<Rarity, number>>,
  entry: { rarity: Rarity; amount: number }
) {
  if (entry.amount <= 0) return
  into[entry.rarity] = (into[entry.rarity] ?? 0) + entry.amount
}
