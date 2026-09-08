import type { UnitId } from "@workspace/game-domain"

import type {
  ArenaGoalContribution,
  ArenaMode,
  ArenaRosterCharacter,
} from "./arena-recommendations.types"
import type {
  SalvageEligibleCharacter,
  SalvageRosterCatalog,
  SalvageTrack,
} from "./salvage-recommendations.types"
import type {
  TeamPreferences,
  TeamRecommendations,
} from "./team-recommendations.types"
import type { OnslaughtShardRecipientResult } from "./onslaught-shard-recipient"

// Onslaught reuses Salvage Run's three alliance tracks (`SalvageTrack` / `SALVAGE_TRACKS` /
// `isSalvageTrack`) directly rather than re-exporting them under Onslaught names.

/** One owned Character that is the target of an active Onslaught-farming Ascension goal, feeding the
 * Plan Team's highest-priority pool. `projectId` is set only when the goal belongs to the selected
 * project. Machine-of-War Onslaught goals never appear here — they feed the shard recipient only. */
export type OnslaughtAscensionGoalContribution = {
  unitId: UnitId
  goalId: string
  projectId?: string
}

export type OnslaughtRecommendations = TeamRecommendations

export type BuildOnslaughtRecommendationsInput = {
  mode: ArenaMode
  /** The selected alliance track. The roster is narrowed to this alliance before anything else. */
  track: SalvageTrack
  /** Owned characters only, across every alliance — the builder filters to the track. */
  roster: readonly ArenaRosterCharacter[]
  selectedProjectId: string | undefined
  activeProjectContributions: readonly ArenaGoalContribution[]
  activeGoalContributions: readonly ArenaGoalContribution[]
  /** Owned Characters targeted by an active Onslaught-farming Ascension goal (any alliance — the
   * builder intersects with the track roster). Highest-priority Plan Team pool. */
  onslaughtAscensionGoals: readonly OnslaughtAscensionGoalContribution[]
  teamSize: number
  lockedRandomUnitIds: readonly UnitId[]
  randomSeed: number
  preferences?: TeamPreferences
  rosterCatalog: SalvageRosterCatalog
}

/** What `useOnslaughtRecommendations` exposes to the Onslaught page — the Salvage Run view model plus
 * the post-battle shard recipient, which is shown in every non-loading / non-error branch (including
 * the per-track insufficient-roster state). */
export type OnslaughtRecommendationsViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "insufficient-track"
      track: SalvageTrack
      setTrack: (track: SalvageTrack) => void
      ownedCount: number
      needed: number
      eligible: SalvageEligibleCharacter[]
      shardRecipient: OnslaughtShardRecipientResult
    }
  | {
      status: "ready"
      track: SalvageTrack
      setTrack: (track: SalvageTrack) => void
      mode: ArenaMode
      setMode: (mode: ArenaMode) => void
      teamSize: number
      setTeamSize: (size: number) => void
      availableSizes: number[]
      preferences: TeamPreferences
      setPreferences: (next: Partial<TeamPreferences>) => void
      availableTraits: string[]
      availableDamageTypes: string[]
      toggleRandomLock: (unitId: UnitId) => void
      lockedRandomUnitIds: UnitId[]
      regenerate: () => void
      recommendations: OnslaughtRecommendations
      shardRecipient: OnslaughtShardRecipientResult
    }
