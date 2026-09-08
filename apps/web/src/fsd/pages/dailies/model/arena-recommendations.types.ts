import type { Progression, Rank, UnitId } from "@workspace/game-domain"

import type {
  TeamCategory,
  TeamMode,
  TeamPreferences,
  TeamRecommendations,
} from "./team-recommendations.types"

export {
  MIN_TEAM_SIZE as ARENA_MIN_TEAM_SIZE,
  TEAM_SIZES as ARENA_TEAM_SIZES,
} from "./team-recommendations.types"

/** Team-generation mode. XP Mode is the default (see `use-arena-recommendations`). */
export type ArenaMode = TeamMode

/** The recommended-team categories shown on the Arena page. */
export type ArenaCategoryId = TeamCategory["id"]

export type ArenaRecommendations = TeamRecommendations

/** One owned character, with the raw fields the engine needs. `progression` is the synced
 * progression step (the player-data `progressionIndex` field). Catalog-sourced traits and damage
 * types are merged in by `buildArenaRecommendations` for the preference filters. */
export type ArenaRosterCharacter = {
  unitId: UnitId
  rank: Rank
  progression: Progression
  xpLevel: number
  appliedUpgradeCount: number
  activeAbilityLevel: number
  passiveAbilityLevel: number
}

/** Catalog-sourced attributes the preference controls filter on, keyed by unit id. */
export type ArenaRosterCatalog = ReadonlyMap<
  UnitId,
  { traits: readonly string[]; damageTypes: readonly string[] }
>

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
  /** Preferred trait / damage type (soft filters). Absent or all-empty means no preference. */
  preferences?: TeamPreferences
  /** Catalog traits / damage types per owned unit, for the preference filters. Omitted in unit
   * tests that do not exercise preferences. */
  rosterCatalog?: ArenaRosterCatalog
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
      /** Preferred trait / damage type and its setter (merge-patch; `undefined` clears a field). */
      preferences: TeamPreferences
      setPreferences: (next: Partial<TeamPreferences>) => void
      /** The traits / damage types the owned roster actually covers, for the control options. */
      availableTraits: string[]
      availableDamageTypes: string[]
      /** Lock/unlock a character in the Random Team. */
      toggleRandomLock: (unitId: UnitId) => void
      lockedRandomUnitIds: UnitId[]
      /** Reshuffle only the Random Team. */
      regenerate: () => void
      recommendations: ArenaRecommendations
    }
