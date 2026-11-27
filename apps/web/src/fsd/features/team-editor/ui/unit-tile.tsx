import { memo, useId } from "react"
import type { KeyboardEvent, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait, capRosterUnit } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { TruncatedText } from "@/shared/ui"

import { cappedView } from "../model/capped-view"
import type { PickerUnit } from "../model/unit-picker"
import { UnitAbilities } from "./unit-abilities"

/**
 * One unit tile (handoff 5.10): a checkbox that adds or removes the unit, with its capped state and
 * flags. One Tab stop per grid: the grid owns `tabIndex` and the arrow keys (`useRovingGrid`). A unit in
 * the team is filled and carries a check mark, so it reads as selected apart from the focus ring.
 * A page can block a tile with a reason (`blockedReason`: it stays focusable and says why on hover
 * and focus), dim it, and add a `note` under its name.
 */
export const UnitTile = memo(function UnitTile({
  unit,
  selected,
  usedIn,
  roster,
  rarityCap,
  disabled,
  blockedReason,
  dimmed = false,
  note,
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
  /** Why the tile can't be picked now; it stays focusable and shows this in a tooltip. */
  blockedReason?: string
  dimmed?: boolean
  /** A line under the name, such as where a unit went. */
  note?: ReactNode
  tabIndex: number
  onFocus: (id: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onToggle: (unit: PickerUnit) => void
}) {
  const { t } = useTranslation(["teams", "progression"])
  // The aria-label replaces the tile's text, so the "also in" note is its description instead.
  const usedId = useId()
  // Rank and rarity show on the portrait; the tile adds the ability levels. What is under the
  // cap is said in the lineup only, for the units the team actually has.
  const capped = unit.roster
    ? capRosterUnit(unit.roster, rarityCap, progressionRarity)
    : undefined
  const button = (
    <button
      aria-checked={selected}
      aria-describedby={usedIn ? usedId : undefined}
      aria-disabled={blockedReason === undefined ? undefined : true}
      aria-label={unit.name}
      className={cn(
        "relative flex w-full min-w-0 flex-col items-center justify-start gap-1 rounded-xl border bg-card interactive-surface p-1.5 text-center disabled:opacity-50",
        selected && "border-primary bg-primary/25",
        dimmed && "opacity-60",
        blockedReason !== undefined && "cursor-not-allowed opacity-50"
      )}
      data-roving-item
      disabled={disabled}
      onClick={() => {
        if (blockedReason === undefined) onToggle(unit)
      }}
      onFocus={() => onFocus(unit.id)}
      onKeyDown={onKeyDown}
      // The picker is a multi-select, so each tile is a checkbox (ui-style-guide rule 3 bans a
      // hand-written aria-pressed).
      role="checkbox"
      tabIndex={tabIndex}
      type="button"
    >
      {selected ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          data-testid="team-picker-selected"
        >
          <Check className="size-icon-xs" strokeWidth={3} />
        </span>
      ) : null}
      <TeamUnitPortrait
        size="portrait-md"
        unit={cappedView(unit.kind, unit.id, roster, rarityCap)}
      />
      <span className="w-full truncate text-xs font-medium">{unit.name}</span>
      {capped ? <UnitAbilities levels={capped.abilityLevels} /> : null}
      {note}
      {usedIn ? (
        <TruncatedText
          className="w-full text-xs wrap-break-word text-warning-foreground"
          data-testid="team-picker-used"
          id={usedId}
          lines={2}
        >
          {t("picker.usedIn", { teams: usedIn.join(", ") })}
        </TruncatedText>
      ) : null}
    </button>
  )
  return (
    <li
      className="flex min-w-0"
      data-locked={unit.owned === false ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      data-testid="team-picker-tile"
      data-unit={unit.id}
      data-used={usedIn ? "true" : undefined}
    >
      {blockedReason === undefined ? (
        button
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{blockedReason}</TooltipContent>
        </Tooltip>
      )}
    </li>
  )
})
