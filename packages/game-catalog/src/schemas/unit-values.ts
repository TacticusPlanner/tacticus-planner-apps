// The unit and ability vocabularies as plain values, kept apart from the zod schemas so a
// consumer that only needs the lists (filters, labels) doesn't pull zod into its bundle.

/**
 * Whether a character or MoW can summon: `none`; `optional` (only an active ability summons, so the player decides
 * whether it summons); `conditional` (a passive summons, but only while the player keeps up a condition they can
 * avoid, such as Tan Gi'da's active or Vynn repairing, so it is easy to summon by accident); `forced` (a passive
 * ability summons on its own, so the player cannot prevent it).
 */
export const unitSummons = [
  "none",
  "optional",
  "conditional",
  "forced",
] as const
export type UnitSummons = (typeof unitSummons)[number]

/** What a unit's ability does, hand curated in the catalog: deals damage, supports allies, or other utility. */
export const abilityRoles = ["damage", "support", "utility"] as const
export type AbilityRole = (typeof abilityRoles)[number]

/** Who a unit's ability targets: no target (self, buff or summon), a single unit, or an area. */
export const abilityTargets = ["none", "single", "aoe"] as const
export type AbilityTarget = (typeof abilityTargets)[number]

/** The ability kinds: a character's active and passive, a MoW's primary and secondary. */
export const abilityKinds = [
  "active",
  "passive",
  "primary",
  "secondary",
] as const
export type AbilityKind = (typeof abilityKinds)[number]

/** Whether an ability is itself a melee or ranged attack. */
export const abilityAttacks = ["melee", "ranged"] as const
export type AbilityAttack = (typeof abilityAttacks)[number]
