import type { TeamCardViewModel } from "./teams.view-model"

/** How a team's depth bar is coloured: `manual` for a depth the player set, `close` for an
 *  estimate within `CLOSE_TO_NEXT_PCT` of the next battle (a small upgrade may clear it), `room`
 *  for any other estimate, `none` without a depth. */
export type DepthTone = "manual" | "close" | "room" | "none"

/** An estimate this close to the next battle's threshold, in percent, reads as close to it. */
const CLOSE_TO_NEXT_PCT = 10

export interface DepthBar {
  /** Battles 1..filled are inside the depth; 0 when the team clears none or has no depth. */
  filled: number
  /** Battles 1..sure clear for sure (≤ filled); equals `filled` for a manual depth. */
  sure: number
  /** Battles filled+1..stretch are a stretch (≥ filled); equals `filled` for a manual depth. */
  stretch: number
  total: number
  tone: DepthTone
}

/** The depth bar of a team card: its displayed depth over the lane's battles, toned by where the
 *  depth comes from and, for an estimate, how close the next battle is, with the estimate's sure
 *  and stretch depths around it. */
export function teamDepthBar(
  card: Pick<
    TeamCardViewModel,
    "displayedDepth" | "expectedBattleClears" | "estimate"
  >,
  total: number
): DepthBar {
  const depth = card.displayedDepth
  if (depth === null)
    return { filled: 0, sure: 0, stretch: 0, total, tone: "none" }
  const clamp = (value: number) => Math.min(Math.max(value, 0), total)
  const filled = clamp(depth)
  if (card.expectedBattleClears !== null)
    return { filled, sure: filled, stretch: filled, total, tone: "manual" }
  const shortfall = card.estimate?.shortfallToNextPct
  const tone =
    shortfall !== null &&
    shortfall !== undefined &&
    shortfall <= CLOSE_TO_NEXT_PCT
      ? "close"
      : "room"
  const sure = Math.min(clamp(card.estimate?.sureDepth ?? filled), filled)
  const stretch = Math.max(clamp(card.estimate?.stretchDepth ?? filled), filled)
  return { filled, sure, stretch, total, tone }
}
