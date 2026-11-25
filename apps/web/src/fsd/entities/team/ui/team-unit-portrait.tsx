import {
  characterIcon,
  lockIcon,
  mowIcon,
  rankIcon,
} from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { UnitPortrait } from "@/entities/unit/@x/team"
import { EntityIcon, portraitBadgeSize } from "@/shared/ui"

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

/**
 * A team unit on the shared `UnitPortrait` (`portrait-sm` in rows and chips, `portrait-md` in a grid; ui-style-guide
 * rule 6): ringed in its rarity colour when owned, greyed with a padlock badge when the synced roster
 * shows it locked, else with its rank as the badge. Decorative: the caller names the unit.
 */
export function TeamUnitPortrait({
  unit,
  size = "portrait-sm",
  className,
}: {
  unit: TeamUnitView
  size?: "portrait-sm" | "portrait-md"
  className?: string
}) {
  const unitId = unit.unitId as UnitId
  const src =
    unit.kind === "character" ? characterIcon(unitId) : mowIcon(unitId)
  const rarity = unit.progression
    ? progressionRarity(unit.progression)
    : undefined
  const badge = portraitBadgeSize(size)
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-block shrink-0", className)}
      data-locked={unit.owned === false ? "true" : undefined}
      data-rarity={rarity}
    >
      <UnitPortrait
        greyed={unit.owned === false}
        rarity={rarity}
        size={size}
        src={src ?? ""}
      />
      {unit.owned === false ? (
        <span className="absolute -top-1 -right-1 grid place-items-center rounded-full bg-overlay p-0.5">
          <EntityIcon alt="" size={badge} src={lockIcon()} />
        </span>
      ) : unit.rank ? (
        <span className="absolute -right-1 -bottom-1 flex">
          <EntityIcon alt="" size={badge} src={rankIcon(unit.rank)} />
        </span>
      ) : null}
    </span>
  )
}
