import type { CSSProperties } from "react"
import type { Rank } from "@workspace/game-domain"

/** The chip's background and edge in the unit's rank colour (the `--rank-*` tokens, which flip
 *  with the theme), so a column reads by rank at a glance as V1's table did. Also used for the
 *  leaderboards' rank cells. */
export function rankTone(rank: Rank | undefined): CSSProperties | undefined {
  if (!rank) return undefined
  const token = `var(--rank-${rank.toLowerCase()})`
  return {
    backgroundColor: `color-mix(in oklab, ${token} 60%, transparent)`,
    borderColor: token,
  }
}
