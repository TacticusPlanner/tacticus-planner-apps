import {
  battleGlyphIcon,
  damageTypeIcon,
  factionIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"

import type { ObjectiveIconSpec } from "@/shared/ui"

/** The served bonus objective types the tab words; any other type shows raw with its score. */
export const QUEST_OBJECTIVE_TYPES = [
  "NoDamageTakenByAnyHero",
  "NotTrait",
  "NotFaction",
  "NotDamageType",
  "DamageType",
  "HasRangedAttack",
  "MaxHits",
  "MinHits",
  "UseNoSummons",
  "DoNoHealOrRepair",
] as const

export type QuestObjectiveType = (typeof QUEST_OBJECTIVE_TYPES)[number]

/** Types that restrict who may be deployed (or what they may do), marked as restrictions. */
const RESTRICTING_TYPES: ReadonlySet<string> = new Set([
  "NotTrait",
  "NotFaction",
  "NotDamageType",
  "HasRangedAttack",
  "MaxHits",
  "MinHits",
  "UseNoSummons",
  "DoNoHealOrRepair",
])

// Quest data names a few traits differently from the catalog's trait ids.
const TRAIT_ALIASES: Readonly<Record<string, string>> = {
  BeastSlayer: "BeastSnagga",
}

export function isKnownObjectiveType(type: string): type is QuestObjectiveType {
  return (QUEST_OBJECTIVE_TYPES as readonly string[]).includes(type)
}

export function isRestrictingObjective(type: string): boolean {
  return RESTRICTING_TYPES.has(type)
}

/** The catalog trait id a served `NotTrait` target names. */
export function objectiveTraitId(target: string): string {
  return TRAIT_ALIASES[target] ?? target
}

const not = (src: string): ObjectiveIconSpec => ({ src, badge: "not" })

/**
 * The game icon that names what an objective is about, drawn as Legendary Events draw it: the trait,
 * faction or damage type it targets, hits, a ranged attack, summons or healing, with a red X badge
 * for "not" and a "≤" / "≥" badge for a hits bound. Undefined when the objective has no such subject
 * (no damage taken) or the type is unknown.
 */
export function objectiveIcon(objective: {
  type: string
  target?: string | null
}): ObjectiveIconSpec | undefined {
  const target = objective.target ?? ""
  switch (objective.type) {
    case "NotTrait":
      return target ? not(traitIcon(objectiveTraitId(target))) : undefined
    case "NotFaction": {
      const src = target ? factionIcon(target) : undefined
      return src ? not(src) : undefined
    }
    case "NotDamageType":
      return target ? not(damageTypeIcon(target)) : undefined
    case "DamageType":
      return target ? { src: damageTypeIcon(target) } : undefined
    case "MaxHits":
      return { src: statIcon("hits"), badge: "max" }
    case "MinHits":
      return { src: statIcon("hits"), badge: "min" }
    case "HasRangedAttack":
      return { src: statIcon("ranged") }
    case "UseNoSummons":
      return not(battleGlyphIcon("summon"))
    case "DoNoHealOrRepair":
      return not(battleGlyphIcon("heal"))
    default:
      return undefined
  }
}
