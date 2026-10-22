import type { Alliance, UnitId } from "@workspace/game-domain"
import type { GameCatalogHseTracker } from "@workspace/game-catalog"

import type { HseTokenMode } from "@/features/home-screen-event-points"
import type { UnitPowerContext } from "@/shared/unit-power"

import type { RosterCharacter } from "./roster-character"
import type { TrackEligibleCharacter, AllianceTrack } from "./alliance-tracks"
import type { TeamCategory } from "./team-recommendations.types"

/** The token game modes the HSE event teams cover, by their catalog names, in display order. */
export type HseTeamMode = HseTokenMode

/** Every HSE event team holds five characters (design D1: no team size control). */
export const HSE_TEAM_SIZE = 5

/** Catalog attributes the event-unit filters read, keyed by owned unit id. */
export type HseTeamCatalog = ReadonlyMap<
  UnitId,
  { traits: readonly string[]; alliance: Alliance; faction: string }
>

/** An enemy an enemy-side rule names: a trait, an alliance, a faction or one unit. */
export type HseEnemyLabel = {
  via: "trait" | "alliance" | "faction" | "unit"
  id: string
}

/** One enemy-side rule of a mode's scoring trackers: only `allowed` enemies count (when set), and
 * never the `excluded` ones. Summons and Steppables left out alone make no hint. */
export type HseEnemyHint = {
  allowed: HseEnemyLabel[]
  excluded: HseEnemyLabel[]
}

/** How a team's event-unit pool was chosen (design D2). */
export type HseTeamPick =
  /** Owned characters passing a scoring tracker's player filter. When another scoring tracker of the
   * mode counts any unit, they only lead the team: the rest score too, so it is never broadened. */
  | { kind: "event-units" }
  /** No scoring tracker has a player filter: any unit scores, so the team is the strongest five. */
  | { kind: "any-unit" }
  /** A line-up event (Faction Focus): a faction with five owned characters first, then the one
   * whose five strongest sum highest. */
  | { kind: "faction"; factionId: string }

export type HseTeam =
  | {
      status: "ready"
      /** The alliance the team is narrowed to; null for Arena (the whole roster). */
      alliance: AllianceTrack | null
      pick: HseTeamPick
      /** The engine's Plan team; `broadened` when non-event units fill it. */
      team: TeamCategory
    }
  | {
      /** Fewer than three owned characters for this team: no team can be built. */
      status: "insufficient"
      alliance: AllianceTrack | null
      ownedCount: number
      needed: number
      eligible: TrackEligibleCharacter[]
    }

export type HseModeTeams = {
  mode: HseTeamMode
  /** Distinct enemy-side rules of the mode's scoring trackers. */
  hints: HseEnemyHint[]
  /** One team for Arena; one per alliance (Imperial, Chaos, Xenos) otherwise. */
  teams: HseTeam[]
}

export type HseTeamRecommendations = {
  /** The modes the event scores in, in display order. Empty when it scores in none. */
  modes: HseModeTeams[]
}

export type BuildHseTeamRecommendationsInput = {
  /** The resolved variant's point trackers. */
  trackers: readonly GameCatalogHseTracker[]
  /** Owned characters only, across every alliance. */
  roster: readonly RosterCharacter[]
  /** Catalog attributes per owned character; a character without a row is left out. */
  catalog: HseTeamCatalog
  /** The power formula's game data for the strength ordering; null when it is unavailable (every
   * character then counts as power 0). */
  unitPower: UnitPowerContext | null
}

/** What `useHseTeamRecommendations` exposes to the HSE page. */
export type HseTeamsViewModel =
  /** Past, Global, no `config.hse`, or no scoring in Arena, Onslaught or Salvage Run. */
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; recommendations: HseTeamRecommendations }
