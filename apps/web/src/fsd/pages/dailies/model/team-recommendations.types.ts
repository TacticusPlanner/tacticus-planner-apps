import type { Progression, Rank, Rarity, UnitId } from "@workspace/game-domain"

/** Team-generation mode. XP Mode is the default (see the Dailies team hooks). */
export type TeamMode = "xp" | "power"

/** The two categories every Dailies team page shows. */
type TeamCategoryId = "plan" | "random"

/** Every recommended team holds at least this many characters. */
export const MIN_TEAM_SIZE = 3
/** The team sizes the page-level "Team size" control offers (also the max team size). */
export const TEAM_SIZES: readonly number[] = [3, 4, 5]

/** Why a character ended up in a recommended team. `goal` is the generic "a configured priority
 * pool claimed this character" rationale — the pool supplies its own `goalId`/`projectId`. */
export type TeamMemberRationale =
  | { kind: "goal"; goalId: string; projectId?: string }
  | { kind: "strength"; combatPower: number }
  | { kind: "minimum-size" }
  | { kind: "random" }

export type TeamMember = {
  unitId: UnitId
  /** The character's current rank, shown on the team row. */
  rank: Rank
  /** The character's current rarity (from its progression tier), shown on the team row. */
  rarity: Rarity
  /** Random Team only: the player has locked this character so it survives Regenerate. Always
   * `false` for the Plan Team. */
  locked: boolean
  rationale: TeamMemberRationale
}

export type TeamCategory = {
  id: TeamCategoryId
  /** The id of the widest configured pool the final team drew on (`"full-roster"` for the implicit
   * roster pool the engine always appends, and always for the Random Team). */
  poolUsed: string
  /** True when `poolUsed` is wider than this category's primary (highest-priority) pool. */
  broadened: boolean
  /** XP Mode only: true when XP-capped characters were included to reach the minimum size. */
  includedCappedCharacters: boolean
  /** The team size the page-level control asked for. */
  requestedSize: number
  /** How many characters the team actually holds — below `requestedSize` when the pool could not
   * fill it. */
  deliveredSize: number
  members: TeamMember[]
}

export type TeamRecommendations = {
  categories: TeamCategory[]
}

/** One owned character with the fields the engine needs. `progression` is the synced progression
 * step (player-data `progressionIndex`). `traits` / `damageTypes` come from the game catalog and
 * are `[]` when the catalog has no row for the unit; they drive the preference filters only. */
export type TeamRosterCharacter = {
  unitId: UnitId
  rank: Rank
  progression: Progression
  xpLevel: number
  appliedUpgradeCount: number
  activeAbilityLevel: number
  passiveAbilityLevel: number
  traits: readonly string[]
  damageTypes: readonly string[]
}

/** One priority pool the Plan Team widens through, highest priority first. `unitIds` is a subset of
 * the mode-eligible roster; `rationaleFor` returns the rationale to show for a character the pool
 * claims, or `undefined` to fall through to the generic strength / minimum-size rationale. */
export type TeamPoolSpec = {
  id: string
  unitIds: ReadonlySet<UnitId>
  rationaleFor: (unitId: UnitId) => TeamMemberRationale | undefined
}

/** Soft candidate filters. An unset field matches every character. Applied as an extra AND term on
 * eligibility, so an under-supplied preference widens the pool rather than shrinking the team, and
 * a preference no owned character satisfies is ignored entirely. */
export type TeamPreferences = {
  trait?: string
  damageType?: string
}

export type BuildTeamRecommendationsInput = {
  mode: TeamMode
  /** The page-level requested team size — applies to both the Plan Team and the Random Team. */
  teamSize: number
  /** Owned characters, already narrowed to this run's eligible roster (e.g. one alliance). The
   * engine never re-adds a character omitted here. The caller guarantees at least `MIN_TEAM_SIZE`. */
  roster: readonly TeamRosterCharacter[]
  /** Priority pools, highest first. The engine appends the full roster as an implicit last pool. */
  pools: readonly TeamPoolSpec[]
  preferences: TeamPreferences
  /** Random Team characters the player has locked; kept across Regenerate even when a filter would
   * otherwise drop them. */
  lockedRandomUnitIds: readonly UnitId[]
  /** Reshuffle token for the Random Team — starts at 0, +1 per Regenerate, resets to 0 on reload. */
  randomSeed: number
}
