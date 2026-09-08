import type { Alliance, Rank, Rarity, UnitId } from "@workspace/game-domain"

import type {
  ArenaGoalContribution,
  ArenaMode,
  ArenaRosterCharacter,
} from "./arena-recommendations.types"
import type {
  TeamPreferences,
  TeamRecommendations,
} from "./team-recommendations.types"

/** One owned character of the selected track's alliance, for the insufficient-roster display. */
export type SalvageEligibleCharacter = {
  unitId: UnitId
  rank: Rank
  rarity: Rarity
}

/** The three Salvage Run alliance tracks. `Neutral` has no track and is never selectable. */
export type SalvageTrack = Extract<Alliance, "Imperial" | "Chaos" | "Xenos">

/** Track order for the selector and the persisted-track fallback (first entry is the default). */
export const SALVAGE_TRACKS: readonly SalvageTrack[] = [
  "Imperial",
  "Chaos",
  "Xenos",
]

export function isSalvageTrack(value: unknown): value is SalvageTrack {
  return value === "Imperial" || value === "Chaos" || value === "Xenos"
}

/** Catalog-sourced attributes keyed by unit id: the preference-filter inputs plus the character's
 * alliance, which decides which track it belongs to. */
export type SalvageRosterCatalog = ReadonlyMap<
  UnitId,
  {
    traits: readonly string[]
    damageTypes: readonly string[]
    alliance: Alliance
  }
>

export type SalvageRecommendations = TeamRecommendations

export type BuildSalvageRecommendationsInput = {
  mode: ArenaMode
  /** The selected alliance track. The roster is narrowed to this alliance before anything else. */
  track: SalvageTrack
  /** Owned characters only, across every alliance — the builder filters to the track. */
  roster: readonly ArenaRosterCharacter[]
  selectedProjectId: string | undefined
  activeProjectContributions: readonly ArenaGoalContribution[]
  activeGoalContributions: readonly ArenaGoalContribution[]
  teamSize: number
  lockedRandomUnitIds: readonly UnitId[]
  randomSeed: number
  preferences?: TeamPreferences
  /** Required here (unlike Arena) — the alliance field drives the track restriction. */
  rosterCatalog: SalvageRosterCatalog
}

/** What `useSalvageRecommendations` exposes to the Salvage Run page. */
export type SalvageRecommendationsViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      /** The selected track owns fewer than three characters — no full team is possible. */
      status: "insufficient-track"
      track: SalvageTrack
      setTrack: (track: SalvageTrack) => void
      /** How many characters of the track's alliance the player owns (0, 1, or 2). */
      ownedCount: number
      /** How many more are needed to reach a team of three. */
      needed: number
      /** The eligible owned characters of the track's alliance, for display. */
      eligible: SalvageEligibleCharacter[]
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
      recommendations: SalvageRecommendations
    }
