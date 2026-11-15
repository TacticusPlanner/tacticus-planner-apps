import { progressionVisual, starsVisual } from "@workspace/game-catalog"
import type { ProgressionVisual } from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

type StarsProps = {
  className?: string
  "data-testid"?: string
}

/**
 * Stars in their short form: one star icon followed by the count (or the single wings image at
 * the top step), as Collection's roster rows show them. Renders nothing for a step with no stars.
 * Decorative: the caller names the progression for assistive technology.
 */
function StarsMark({
  visual,
  className,
  "data-testid": testId,
}: StarsProps & { visual: ProgressionVisual }) {
  if (visual.kind === "none") return null
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-semibold tabular-nums",
        className
      )}
      data-part="stars"
      data-testid={testId}
    >
      {visual.kind === "stars" ? (
        <>
          <EntityIcon src={visual.icon} alt="" className="size-3.5" />
          {visual.count}
        </>
      ) : (
        <EntityIcon
          src={visual.icon}
          alt=""
          className="h-4 w-auto"
          width={512}
          height={164}
        />
      )}
    </span>
  )
}

/** A progression's stars in the short form (see `StarsMark`). */
export function CompactStars({
  progression,
  ...props
}: StarsProps & { progression: Progression }) {
  return <StarsMark visual={progressionVisual(progression)} {...props} />
}

/** A raw 0-14 star index (NPC and raid boss stat rows) in the same short form. */
export function CompactStarLevel({
  starLevel,
  ...props
}: StarsProps & { starLevel: number }) {
  return <StarsMark visual={starsVisual(starLevel)} {...props} />
}
