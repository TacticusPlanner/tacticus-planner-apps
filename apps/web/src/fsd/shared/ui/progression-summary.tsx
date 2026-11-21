import type { Progression, Rank } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { CompactProgression } from "./compact-progression"
import { RankBadge } from "./rank-badge"

/**
 * A unit's progression as icons instead of a sentence: rarity and stars, then the rank (each named
 * for assistive technology and in a tooltip), then any levels as short text ("ability level 8").
 * Use it wherever copy would spell out "Legendary 3★, Gold II, ability level 40".
 */
export function ProgressionSummary({
  progression,
  rank,
  details = [],
  className,
  "data-testid": testId,
}: {
  progression: Progression
  rank?: Rank
  /** Short trailing facts, joined with " · ". */
  details?: readonly string[]
  className?: string
  "data-testid"?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 align-middle",
        className
      )}
      data-testid={testId}
    >
      <CompactProgression value={progression} />
      {rank === undefined ? null : (
        <>
          <span aria-hidden="true">·</span>
          <RankBadge rank={rank} showLabel={false} tooltip />
        </>
      )}
      {details.length > 0 ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{details.join(" · ")}</span>
        </>
      ) : null}
    </span>
  )
}
