import type { Progression, Rank, UnitId } from "@workspace/game-domain"

/** Team-generation mode. XP Mode is the default (see `use-arena-recommendations`). */
export type ArenaMode = "xp" | "power"

/** The recommended-team categories shown on the Arena page. The Home Screen Event category is
 * deferred (issue #111) and is not produced here. */
export type ArenaCategoryId = "active-project" | "overall-goals" | "random"

/** Candidate pools, in the fixed priority order the engine widens through. */
export type ArenaPool = "active-project" | "overall-goals" | "full-roster"

export const ARENA_POOL_ORDER: readonly ArenaPool[] = [
  "active-project",
  "overall-goals",
  "full-roster",
]

/** Every recommended team holds at least this many characters. */
export const ARENA_MIN_TEAM_SIZE = 3
/** An Arena team holds at most this many characters. */
export const ARENA_MAX_TEAM_SIZE = 5

/** Why a character ended up in a recommended team. */
export type ArenaMemberRationale =
  | { kind: "goal"; goalId: string; projectId?: string }
  | { kind: "strength"; combatPower: number }
  | { kind: "minimum-size" }
  | { kind: "random" }

export type ArenaTeamMember = {
  unitId: UnitId
  rationale: ArenaMemberRationale
}

export type ArenaTeamVariant = {
  /** Number of characters in this variant (3–5). */
  size: number
  /** The variant shown as the category's primary recommendation. In XP Mode this is the
   * three-character variant; in Power Mode it is the sole variant. */
  isPrimary: boolean
  members: ArenaTeamMember[]
}

/** Set when a category has no basis of its own to build from. */
type ArenaCategoryEmptyReason = "no-active-project" | "no-active-goals"

export type ArenaCategory = {
  id: ArenaCategoryId
  /** The widest pool the final team drew on. */
  poolUsed: ArenaPool
  /** True when `poolUsed` is wider than this category's primary pool. */
  broadened: boolean
  /** XP Mode only: true when XP-capped characters were included to reach the minimum size. */
  includedCappedCharacters: boolean
  emptyReason?: ArenaCategoryEmptyReason
  /** Empty when `emptyReason` is set. XP Mode: up to three variants (sizes 3/4/5). Power Mode and
   * the random category: exactly one. */
  variants: ArenaTeamVariant[]
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
 * active-project contribution list. */
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
  /** Whether the player has a project marked as their active plan. */
  hasActiveProject: boolean
  /** Active-status character goals belonging to the active project. Empty when there is no active
   * project or it has no such goals. */
  activeProjectContributions: readonly ArenaGoalContribution[]
  /** Every active-status character goal, across all projects. */
  activeGoalContributions: readonly ArenaGoalContribution[]
  /**
   * Reshuffle token for the random category — starts at 0 and increments by one per regenerate, so
   * a build can reconstruct the immediately-previous random team from `randomSeed - 1` and
   * guarantee the new one differs when the roster is large enough. Resets to 0 on reload (the
   * random team is never persisted).
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
      /** Reshuffle only the Random Team. */
      regenerate: () => void
      recommendations: ArenaRecommendations
    }
