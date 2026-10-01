import type { RuleBattle, RuleNpc } from "./home-screen-event-rules"

type TraitNpcs = ReadonlyMap<string, Pick<RuleNpc, "traits">>

/**
 * The traits present on a battle's enemies: the union over `detailedEnemyTypes[].id`, resolved
 * through the `npcs` dataset exactly as the Home Screen Event rules resolve their enemies. An id the
 * dataset cannot resolve contributes nothing (never guessed).
 */
export function battleEnemyTraits(
  battle: Pick<RuleBattle, "detailedEnemyTypes">,
  npcsById: TraitNpcs
): string[] {
  const traits = new Set<string>()
  for (const enemy of battle.detailedEnemyTypes) {
    for (const trait of npcsById.get(enemy.id)?.traits ?? []) traits.add(trait)
  }
  return [...traits]
}

/** Every distinct trait found on an enemy of at least one battle, sorted by id. */
export function listEnemyTraits(
  battles: readonly Pick<RuleBattle, "detailedEnemyTypes">[],
  npcsById: TraitNpcs
): string[] {
  const traits = new Set<string>()
  for (const battle of battles) {
    for (const trait of battleEnemyTraits(battle, npcsById)) traits.add(trait)
  }
  return [...traits].sort((a, b) => a.localeCompare(b))
}
