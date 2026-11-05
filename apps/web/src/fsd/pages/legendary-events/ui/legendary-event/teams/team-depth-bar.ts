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
  total: number
  tone: DepthTone
}

/** The depth bar of a team card: its displayed depth over the lane's battles, toned by where the
 *  depth comes from and, for an estimate, how close the next battle is. */
export function teamDepthBar(
  card: Pick<
    TeamCardViewModel,
    "displayedDepth" | "expectedBattleClears" | "estimate"
  >,
  total: number
): DepthBar {
  const depth = card.displayedDepth
  if (depth === null) return { filled: 0, total, tone: "none" }
  const filled = Math.min(Math.max(depth, 0), total)
  if (card.expectedBattleClears !== null)
    return { filled, total, tone: "manual" }
  const shortfall = card.estimate?.shortfallToNextPct
  const tone =
    shortfall !== null &&
    shortfall !== undefined &&
    shortfall <= CLOSE_TO_NEXT_PCT
      ? "close"
      : "room"
  return { filled, total, tone }
}
