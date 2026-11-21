import {
  battleGlyphIcon,
  damageTypeIcon,
  factionIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"

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

/**
 * The game icon that names what an objective is about: the trait, faction or damage type it
 * targets, hits, a ranged attack, summons or healing. Undefined when the objective has no such
 * subject (no damage taken) or the type is unknown.
 */
export function objectiveIcon(objective: {
  type: string
  target?: string | null
}): string | undefined {
  const target = objective.target ?? ""
  switch (objective.type) {
    case "NotTrait":
      return target ? traitIcon(objectiveTraitId(target)) : undefined
    case "NotFaction":
      return target ? factionIcon(target) : undefined
    case "NotDamageType":
    case "DamageType":
      return target ? damageTypeIcon(target) : undefined
    case "MaxHits":
    case "MinHits":
      return statIcon("hits")
    case "HasRangedAttack":
      return statIcon("ranged")
    case "UseNoSummons":
      return battleGlyphIcon("summon")
    case "DoNoHealOrRepair":
      return battleGlyphIcon("heal")
    default:
      return undefined
  }
}
