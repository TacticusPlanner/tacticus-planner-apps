import {
  characterIcon,
  lockIcon,
  mowIcon,
  rankIcon,
} from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/** What a team's unit shows: ownership, and for an owned unit its progression and rank. */
export interface TeamUnitView {
  kind: "character" | "mow"
  unitId: string
  /** Undefined when the roster has not synced: no lock mark, no progression. */
  owned: boolean | undefined
  progression?: Progression
  /** Characters only. */
  rank?: Rank
}

const SIZES = {
  // ui-style-guide rule 6: Portrait sm in rows and chips, md in a grid.
  sm: { root: "size-10", badge: "size-4" },
  md: { root: "size-16", badge: "size-5.5" },
} as const

/**
 * A unit's round portrait, ringed in its rarity colour when owned, greyed with a padlock when the
 * synced roster shows it locked. `sm` shows one badge (rank), `md` shows rank and the lock.
 * Decorative: the caller names the unit.
 */
export function TeamUnitPortrait({
  unit,
  size = "sm",
  className,
}: {
  unit: TeamUnitView
  size?: keyof typeof SIZES
  className?: string
}) {
  const looks = SIZES[size]
  const unitId = unit.unitId as UnitId
  const src =
    unit.kind === "character" ? characterIcon(unitId) : mowIcon(unitId)
  const rarity = unit.progression
    ? progressionRarity(unit.progression)
    : undefined
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-block shrink-0", looks.root, className)}
      data-locked={unit.owned === false ? "true" : undefined}
      data-rarity={rarity}
    >
      <span
        className={cn(
          "block size-full overflow-hidden rounded-full bg-portrait",
          rarity ? "border-2" : "border border-border",
          unit.owned === false && "border-dashed opacity-60 grayscale"
        )}
        style={
          rarity
            ? { borderColor: `var(--rarity-${rarity.toLowerCase()})` }
            : undefined
        }
      >
        <EntityIcon alt="" className="size-full object-cover" src={src} />
      </span>
      {unit.owned === false ? (
        <span className="absolute -top-1 -right-1 grid place-items-center rounded-full bg-overlay p-0.5">
          <EntityIcon alt="" className={looks.badge} src={lockIcon()} />
        </span>
      ) : unit.rank ? (
        <EntityIcon
          alt=""
          className={cn("absolute -right-1 -bottom-1", looks.badge)}
          src={rankIcon(unit.rank)}
        />
      ) : null}
    </span>
  )
}
