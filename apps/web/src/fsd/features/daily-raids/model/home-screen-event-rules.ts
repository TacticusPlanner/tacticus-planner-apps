/** What a rule reads of an npc record (the catalog `npcs` dataset). */
export type RuleNpc = {
  factionId: string
  alliance: string
  traits: readonly string[]
}

/** What the points calculation reads of a campaign battle. */
export type RuleBattle = {
  type: string
  detailedEnemyTypes: readonly { id: string; count: number }[]
}

const POINTS_PER_ENEMY = 3
const POINTS_PER_ENEMY_ELITE = 5
const ELITE_TYPES: ReadonlySet<string> = new Set(["Elite", "EliteMirror"])
// The game's tracker data never scores these.
const EXCLUDED_TRAITS = ["Summon", "Steppable"]

/**
 * Raid-point rules per Home Screen Event definition id, ported from V1: an event earns points per
 * matching enemy killed in campaign raids. A new raid-relevant event is a one-row addition; every
 * id missing here (Faction Boost, Squig Smash, the 11th-edition weeks, ...) earns no raid points.
 * Keyed by definition id so an API-served rules dataset can replace the table later.
 */
const matchByDefinitionId: Readonly<Record<string, (npc: RuleNpc) => boolean>> =
  {
    "hse-warp-surge": (npc) => npc.alliance === "Chaos",
    "hse-machine-hunt": (npc) => npc.traits.includes("Mechanical"),
    "hse-training-rush": () => true,
    "hse-purge-order": (npc) => npc.factionId === "Tyranids",
  }

export function hasHomeScreenEventRule(definitionId: string): boolean {
  return definitionId in matchByDefinitionId
}

/**
 * Points one raid of `battle` earns under the event: 3 per matching enemy, 5 on Elite and
 * EliteMirror nodes; Summon and Steppable enemies never count, and an enemy id the `npcs` dataset
 * cannot resolve counts as zero (never guessed).
 */
export function battleEventPoints(
  definitionId: string,
  battle: RuleBattle,
  npcsById: ReadonlyMap<string, RuleNpc>
): number {
  const matches = matchByDefinitionId[definitionId]
  if (!matches) return 0
  const perEnemy = ELITE_TYPES.has(battle.type)
    ? POINTS_PER_ENEMY_ELITE
    : POINTS_PER_ENEMY
  let enemies = 0
  for (const enemy of battle.detailedEnemyTypes) {
    const npc = npcsById.get(enemy.id)
    if (!npc || EXCLUDED_TRAITS.some((trait) => npc.traits.includes(trait))) {
      continue
    }
    if (matches(npc)) enemies += enemy.count
  }
  return enemies * perEnemy
}
