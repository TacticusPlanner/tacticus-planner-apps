import { useId, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import type { TeamRoster } from "@/entities/team"
import {
  FILTER_CHIP_CLASS_NAME,
  HintedToggleGroupItem,
  SearchField,
} from "@/shared/ui"

import { filterPickerUnits, pickerFilterOptions } from "../model/unit-picker"
import type { PickerFilters, PickerUnit } from "../model/unit-picker"
import {
  TeamPickerFiltersButton,
  TeamPickerFiltersPanel,
} from "./team-picker-filters"
import { UnitTile } from "./unit-tile"
import { useRovingGrid } from "./use-roving-grid"

/** What a page shows on one tile beyond its unit: why it can't be picked now, a dimmed look, and a
 *  note under the name. */
export interface PickerTileState {
  blockedReason?: string
  dimmed?: boolean
  note?: ReactNode
}

/** A grid of tiles with one Tab stop; the arrow keys move between tiles (see `useRovingGrid`). A
 *  tile blocked by `tileState` stays focusable, so its reason can be read. */
export function TeamPickerGrid({
  units,
  testId,
  columns,
  roster,
  selectedIds,
  usage,
  lockedIds,
  rarityCap,
  onToggle,
  tileState,
}: {
  units: readonly PickerUnit[]
  testId: string
  /** The grid's column classes, sized to the room its list gets. */
  columns: string
  roster: TeamRoster | null
  selectedIds: ReadonlySet<string>
  usage: ReadonlyMap<string, string[]>
  lockedIds: ReadonlySet<string>
  rarityCap: Rarity
  onToggle: (unit: PickerUnit) => void
  tileState?: (unit: PickerUnit) => PickerTileState | undefined
}) {
  const focusable = useMemo(
    () =>
      units.filter((unit) => !lockedIds.has(unit.id)).map((unit) => unit.id),
    [units, lockedIds]
  )
  const { tabIndexFor, onItemFocus, onItemKeyDown } = useRovingGrid(focusable)
  return (
    <ul
      className={cn("grid gap-2", columns)}
      data-roving-grid
      data-testid={testId}
    >
      {units.map((unit) => {
        const state = tileState?.(unit)
        return (
          <UnitTile
            blockedReason={state?.blockedReason}
            dimmed={state?.dimmed}
            disabled={lockedIds.has(unit.id)}
            key={`${unit.kind}:${unit.id}`}
            onFocus={onItemFocus}
            onKeyDown={onItemKeyDown}
            onToggle={onToggle}
            rarityCap={rarityCap}
            roster={roster}
            selected={selectedIds.has(unit.id)}
            tabIndex={tabIndexFor(unit.id)}
            note={state?.note}
            unit={unit}
            usedIn={usage.get(unit.id)}
          />
        )
      })}
    </ul>
  )
}

/**
 * "Owned only", as on Collection: lists only the units the player owns. Without a synced roster
 * nothing can be owned, so it is off and disabled and says why on hover and to screen readers.
 */
function OwnedOnlyChip({
  on,
  onChange,
  rosterAvailable,
}: {
  on: boolean
  onChange: (on: boolean) => void
  rosterAvailable: boolean
}) {
  const { t } = useTranslation("teams")
  const hintId = useId()
  const hint = rosterAvailable ? undefined : t("picker.ownedOnlyNeedsRoster")
  return (
    <>
      <ToggleGroup
        onValueChange={(values) => onChange(values.includes("owned"))}
        type="multiple"
        value={rosterAvailable && on ? ["owned"] : []}
        variant="outline"
      >
        <HintedToggleGroupItem
          aria-describedby={hint ? hintId : undefined}
          className={FILTER_CHIP_CLASS_NAME}
          data-testid="team-picker-owned-only"
          disabledReason={hint}
          value="owned"
        >
          {t("picker.ownedOnly")}
        </HintedToggleGroupItem>
      </ToggleGroup>
      {hint ? (
        <span className="sr-only" id={hintId}>
          {hint}
        </span>
      ) : null}
    </>
  )
}

/**
 * The editor's unit picker (design D2): a name search, the "Filters" button and the "Owned only"
 * chip (as on Collection), then the characters and MoWs that fit, in V1's order. A tap adds or removes a unit.
 * A unit in another team of a selected Guild War mode is flagged and stays selectable. Without a
 * synced roster every unit is listed. On desktop the characters and MoWs are two columns that
 * scroll on their own; on a phone the editor's tabs show one of them (`show`).
 */
export function TeamUnitPicker({
  units,
  roster,
  filters,
  onFiltersChange,
  allowedFactions,
  mows,
  show = "all",
  selectedIds,
  usage,
  lockedIds,
  rarityCap,
  onToggle,
}: {
  units: readonly PickerUnit[]
  roster: TeamRoster | null
  filters: PickerFilters
  onFiltersChange: (patch: Partial<PickerFilters>) => void
  allowedFactions: ReadonlySet<string> | undefined
  /** Whether the team takes MoWs (not for Campaign or Incursion). */
  mows: boolean
  /** Which lists to show: both side by side, or one (a phone tab). */
  show?: "all" | PickerUnit["kind"]
  selectedIds: ReadonlySet<string>
  usage: ReadonlyMap<string, string[]>
  /** Units that cannot be toggled off (a chosen campaign's core). */
  lockedIds: ReadonlySet<string>
  /** The cap units show at: the saved one, or Mythic (as they are) when there is none. */
  rarityCap: Rarity
  onToggle: (unit: PickerUnit) => void
}) {
  const { t, i18n } = useTranslation("teams")
  const options = useMemo(() => pickerFilterOptions(units), [units])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersPanelId = useId()
  const shown = useMemo(
    () =>
      filterPickerUnits(units, filters, {
        allowedFactions,
        mows,
        locale: i18n.language,
      }),
    [units, filters, allowedFactions, mows, i18n.language]
  )
  const characters = shown.filter((unit) => unit.kind === "character")
  const mowUnits = shown.filter((unit) => unit.kind === "mow")
  const showCharacters = show !== "mow"
  const showMows = mows && show !== "character"
  const listed =
    (showCharacters ? characters.length : 0) + (showMows ? mowUnits.length : 0)
  const both = showCharacters && showMows
  const grid = (
    list: readonly PickerUnit[],
    testId: string,
    columns: string
  ) => (
    <TeamPickerGrid
      columns={columns}
      lockedIds={lockedIds}
      onToggle={onToggle}
      rarityCap={rarityCap}
      roster={roster}
      selectedIds={selectedIds}
      testId={testId}
      units={list}
      usage={usage}
    />
  )

  return (
    <section
      aria-label={t("picker.label")}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3",
        // On desktop the picker keeps room for about two rows of units however full the lineup
        // is; when the dialog is too short for that, its body scrolls.
        show === "all" ? "min-h-60" : "min-h-0"
      )}
      data-testid="team-unit-picker"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          className="sm:max-w-none"
          label={t("picker.search")}
          onChange={(search) => onFiltersChange({ search })}
          value={filters.search}
        />
        <TeamPickerFiltersButton
          filters={filters}
          onOpenChange={setFiltersOpen}
          open={filtersOpen}
          panelId={filtersPanelId}
        />
        <OwnedOnlyChip
          on={filters.ownedOnly}
          onChange={(ownedOnly) => onFiltersChange({ ownedOnly })}
          rosterAvailable={roster !== null}
        />
      </div>
      {roster ? null : (
        <p
          className="text-sm text-muted-foreground"
          data-testid="team-picker-no-roster"
        >
          {t("picker.noRoster")}
        </p>
      )}
      {/* Open filters sit above the units on a narrow editor and after them on a wide one. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 @3xl/editor:flex-row">
        <TeamPickerFiltersPanel
          filters={filters}
          onChange={onFiltersChange}
          open={filtersOpen}
          options={options}
          panelId={filtersPanelId}
        />
        {listed === 0 ? (
          <p className="text-sm text-muted-foreground">{t("picker.empty")}</p>
        ) : (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
              both && "@3xl/editor:flex-row"
            )}
          >
            {showCharacters && characters.length > 0 ? (
              <div className="@container flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 @3xl/editor:overflow-y-auto @3xl/editor:p-1">
                {both ? (
                  <h4 className="text-sm font-medium">
                    {t("picker.characters")}
                  </h4>
                ) : null}
                {grid(
                  characters,
                  "team-picker-characters",
                  "grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5 @3xl:grid-cols-6 @5xl:grid-cols-8"
                )}
              </div>
            ) : null}
            {showMows && mowUnits.length > 0 ? (
              <div
                className={cn(
                  "@container flex min-h-0 min-w-0 flex-col gap-1.5",
                  both
                    ? "@3xl/editor:w-64 @3xl/editor:shrink-0 @3xl/editor:overflow-y-auto @3xl/editor:border-l @3xl/editor:p-1 @3xl/editor:pl-4"
                    : "flex-1"
                )}
              >
                {both ? (
                  <h4 className="text-sm font-medium">{t("picker.mows")}</h4>
                ) : null}
                {grid(
                  mowUnits,
                  "team-picker-mows",
                  both
                    ? "grid-cols-3 @3xl/editor:grid-cols-2"
                    : "grid-cols-3 @md:grid-cols-4"
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
