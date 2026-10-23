import type { Alliance, Rank, Rarity, UnitId } from "@workspace/game-domain"

/** The three alliance tracks (Imperial / Chaos / Xenos). `Neutral` has no track. */
export type AllianceTrack = Extract<Alliance, "Imperial" | "Chaos" | "Xenos">

/** Track order for the selector (first entry is the default). */
export const ALLIANCE_TRACKS: readonly AllianceTrack[] = [
  "Imperial",
  "Chaos",
  "Xenos",
]

/** One owned character of a track's alliance, for the insufficient-roster display. */
export type TrackEligibleCharacter = {
  unitId: UnitId
  rank: Rank
  rarity: Rarity
}
