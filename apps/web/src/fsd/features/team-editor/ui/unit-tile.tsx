import { memo } from "react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait, capRosterUnit } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"

import { cappedView } from "../model/capped-view"
import type { PickerUnit } from "../model/unit-picker"
import { UnitAbilities } from "./unit-abilities"

/**
 * One unit tile (handoff 5.10): a toggle that adds or removes the unit, with its capped state and
 * flags. One Tab stop per grid: the grid owns `tabIndex` and the arrow keys (`useRovingGrid`). A unit in
 * the team is filled and carries a check mark, so it reads as selected apart from the focus ring.
 */
export const UnitTile = memo(function UnitTile({
  unit,
  selected,
  usedIn,
  roster,
  rarityCap,
  disabled,
  tabIndex,
  onFocus,
  onKeyDown,
  onToggle,
}: {
  unit: PickerUnit
  selected: boolean
  usedIn: readonly string[] | undefined
  roster: TeamRoster | null
  rarityCap: Rarity
  disabled: boolean
  tabIndex: number
  onFocus: (id: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onToggle: (unit: PickerUnit) => void
}) {
  const { t } = useTranslation(["teams", "progression"])
  // Rank and rarity show on the portrait; the tile adds the ability levels. What is under the
  // cap is said in the lineup only, for the units the team actually has.
  const capped = unit.roster
    ? capRosterUnit(unit.roster, rarityCap, progressionRarity)
    : undefined
  return (
    <li
      className="flex min-w-0"
      data-locked={unit.owned === false ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      data-testid="team-picker-tile"
      data-unit={unit.id}
      data-used={usedIn ? "true" : undefined}
    >
      <button
        aria-label={unit.name}
        aria-pressed={selected}
        className={cn(
          "relative flex w-full min-w-0 flex-col items-center justify-start gap-1 rounded-xl border bg-card p-1.5 text-center outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
          selected && "border-primary bg-primary/25 hover:bg-primary/35"
        )}
        data-roving-item
        disabled={disabled}
        onClick={() => onToggle(unit)}
        onFocus={() => onFocus(unit.id)}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        type="button"
      >
        {selected ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            data-testid="team-picker-selected"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
        <TeamUnitPortrait
          size="md"
          unit={cappedView(unit.kind, unit.id, roster, rarityCap)}
        />
        <span className="w-full truncate text-xs font-medium">{unit.name}</span>
        {capped ? <UnitAbilities levels={capped.abilityLevels} /> : null}
        {usedIn ? (
          <span
            className="line-clamp-2 w-full text-xs wrap-break-word text-amber-800 dark:text-amber-400"
            data-testid="team-picker-used"
            title={t("picker.usedIn", { teams: usedIn.join(", ") })}
          >
            {t("picker.usedIn", { teams: usedIn.join(", ") })}
          </span>
        ) : null}
      </button>
    </li>
  )
})
