import type { Progression, Rank, Rarity, UnitId } from "@workspace/game-domain"

/** Team-generation mode. XP Mode is the default (see `use-arena-recommendations`). */
export type ArenaMode = "xp" | "power"

/** The recommended-team categories shown on the Arena page. The single **Plan Team** replaces the
 * former Active Project / Overall Goals split; the Home Screen Event category is deferred
 * (issue #111) and is not produced here. */
export type ArenaCategoryId = "plan" | "random"

/** Candidate pools, in the fixed priority order the engine widens through. */
export type ArenaPool = "active-project" | "overall-goals" | "full-roster"

export const ARENA_POOL_ORDER: readonly ArenaPool[] = [
  "active-project",
  "overall-goals",
  "full-roster",
]

/** Every recommended team holds at least this many characters. */
export const ARENA_MIN_TEAM_SIZE = 3
/** The team sizes the page-level "Team size" control offers (also the max Arena team size). */
export const ARENA_TEAM_SIZES: readonly number[] = [3, 4, 5]

/** Why a character ended up in a recommended team. */
export type ArenaMemberRationale =
  | { kind: "goal"; goalId: string; projectId?: string }
  | { kind: "strength"; combatPower: number }
  | { kind: "minimum-size" }
  | { kind: "random" }

export type ArenaTeamMember = {
  unitId: UnitId
  /** The character's current rank, shown on the team row. */
  rank: Rank
  /** The character's current rarity (from its progression tier), shown on the team row. */
  rarity: Rarity
  /** Random Team only: the player has locked this character so it survives Regenerate. Always
   * `false` for the Plan Team. */
  locked: boolean
  rationale: ArenaMemberRationale
}

export type ArenaCategory = {
  id: ArenaCategoryId
  /** The widest pool the final team drew on. */
  poolUsed: ArenaPool
  /** True when `poolUsed` is wider than this category's primary pool. */
  broadened: boolean
  /** XP Mode only: true when XP-capped characters were included to reach the minimum size. */
  includedCappedCharacters: boolean
  /** The team size the page-level control asked for. */
  requestedSize: number
  /** How many characters the team actually holds — below `requestedSize` when the pool could not
   * fill it. */
  deliveredSize: number
  members: ArenaTeamMember[]
}

export type ArenaRecommendations = {
  categories: ArenaCategory[]
}

/** One owned character, with the raw fields the engine needs. `progression` is the synced
 * progression step (the player-data `progressionIndex` field). */
export type ArenaRosterCharacter = {
  unitId: UnitId
  rank: Rank
  progression: Progression
  xpLevel: number
  appliedUpgradeCount: number
  activeAbilityLevel: number
  passiveAbilityLevel: number
}

/** A character that is the target of an active goal. `projectId` is set only for the
 * selected-project contribution list. */
export type ArenaGoalContribution = {
  unitId: UnitId
  goalId: string
  projectId?: string
}

/** A synced roster record, narrowed to the fields the mapper reads (`progressionIndex` carries the
 * progression step; `abilities[0]`/`[1]` are the active/passive tracks). */
export type RawRosterCharacter = {
  unitId: UnitId
  rank: Rank
  progressionIndex: Progression
  xpLevel: number
  appliedUpgradeSlots: readonly number[]
  abilities: readonly { level: number }[]
}

/** A goal summary, narrowed to the fields that decide whether it is an active character goal. */
export type RawGoal = {
  goalId: string
  entityType: string
  entityId: string
  status: string
}

export type BuildArenaRecommendationsInput = {
  mode: ArenaMode
  /** Owned characters only. The caller guarantees at least `ARENA_MIN_TEAM_SIZE`. */
  roster: readonly ArenaRosterCharacter[]
  /** The project the player has selected to drive the Plan Team, or `undefined` when the player has
   * no selectable project. Its active goals arrive in `activeProjectContributions`. */
  selectedProjectId: string | undefined
  /** Active-status character goals belonging to the selected project. Empty when there is no
   * selected project or it has no such goals. */
  activeProjectContributions: readonly ArenaGoalContribution[]
  /** Every active-status character goal, across all projects. */
  activeGoalContributions: readonly ArenaGoalContribution[]
  /** The page-level requested team size (3–5) — applies to both the Plan Team and the Random Team. */
  teamSize: number
  /** Random Team characters the player has locked; kept in place across Regenerate, even when a
   * mode filter would otherwise drop them. */
  lockedRandomUnitIds: readonly UnitId[]
  /**
   * Reshuffle token for the random category — starts at 0 and increments by one per regenerate, so
   * consecutive Regenerates can be guaranteed to differ across the unlocked slots. Resets to 0 on
   * reload (the random team is never persisted).
   */
  randomSeed: number
}

/** What `useArenaRecommendations` exposes to the Arena page. */
export type ArenaRecommendationsViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "no-characters" }
  | {
      status: "ready"
      mode: ArenaMode
      setMode: (mode: ArenaMode) => void
      /** The requested team size (3–5) and its setter. */
      teamSize: number
      setTeamSize: (size: number) => void
      /** The subset of `ARENA_TEAM_SIZES` the current roster can deliver. */
      availableSizes: number[]
      /** Lock/unlock a character in the Random Team. */
      toggleRandomLock: (unitId: UnitId) => void
      lockedRandomUnitIds: UnitId[]
      /** Reshuffle only the Random Team. */
      regenerate: () => void
      recommendations: ArenaRecommendations
    }
