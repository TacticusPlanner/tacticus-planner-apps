import { Fragment, useId, useMemo, useState, type Ref } from "react"
import { useTranslation } from "react-i18next"
import { ShieldPlus } from "lucide-react"
import { characterIcon, lockIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import { UnitGoalBadge } from "@/entities/goal"
import {
  ObjectiveIcon,
  unitEffectivePower,
  useObjectiveLabel,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { useUnitName, useUnitSearchNames } from "@/shared/unit-name"

import { MAX_TEAM_MEMBERS } from "../model/team-editor-draft"
import {
  buildPickerTiles,
  filterPickerTiles,
  notMatchingStart,
  objectiveChipCounts,
  toggleObjectiveChip,
  type PickerEstimates,
  type PickerGoalsPreview,
  type PickerSort,
} from "../model/team-picker"
import { TeamPickerObjectiveChips } from "./team-picker-objective-chips"
import { SelectedChip } from "./team-picker-selected-chip"
import { TeamPickerSort } from "./team-picker-sort"
import { TeamPickerTileMarkers } from "./team-picker-tile-markers"
import { TeamPickerUnitState } from "./team-picker-unit-state"

/**
 * The editor's unit picker (design D7): the lane's allowed units as tiles (portrait, name, an owned
 * unit's rarity, rank and estimated clears, the objectives each satisfies with the others muted,
 * the points it has left, locked styling), a name search, an "only unlocked" switch and a Points
 * left / Power sort (Power by default) that resets when the editor closes. A tap toggles membership
 * up to five; the editor refuses a sixth and pulses its count badge. A tile's secondary action
 * sets the reserve. Selected members and the reserve are marked on their tiles (a selected unit
 * stays listed whatever the filters say), so a second tap removes them; one the lane no longer
 * allows (no tile) is listed above the grid with a remove button. With Goals Preview
 * available, a switch
 * (starting from the page's value) shows tiles at their goal targets:
 * owned state, rarity, rank, estimated clears and a preview marker. The lane's objectives sit above
 * the grid as multi-select chips, starting from `initialObjectives`, each with how many listed units
 * satisfy it together with the selected ones: units
 * satisfying every selected objective come first, the others follow dimmed below a labelled divider
 * (still selectable, with an accessible "does not satisfy" description); the selection lives as
 * long as the picker, so it resets when the editor closes and survives Save and add another. A tile's top-left corner marks
 * its horde-mode tier and Healer / Mechanic traits.
 */
export function TeamUnitPicker({
  lane,
  units,
  roster,
  memberUnitIds,
  reserveUnitId,
  onlyUnlockedDefault,
  onToggleMember,
  onToggleReserve,
  goalsPreview,
  goalLines,
  searchInputRef,
  progress,
  estimates,
  initialObjectives = [],
}: {
  lane: LegendaryEventLane
  units: readonly LegendaryEventUnit[]
  roster: readonly LegendaryEventRosterUnit[] | undefined
  memberUnitIds: readonly string[]
  reserveUnitId: string | null
  onlyUnlockedDefault: boolean
  onToggleMember: (unitId: string) => void
  onToggleReserve: (unitId: string) => void
  goalsPreview?: PickerGoalsPreview
  goalLines?: (unitId: string) => readonly string[]
  /** The search field, focused by Save and add another. */
  searchInputRef?: Ref<HTMLInputElement>
  /** The lane's synced progress; undefined while it loads or failed (nothing is cleared). */
  progress?: LaneProgressView
  /** The lane's clear estimates on the synced roster; absent when unavailable. */
  estimates?: PickerEstimates
  /** The objective chips selected when the picker opens (a suggestion's objectives). */
  initialObjectives?: readonly number[]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const searchNamesOf = useUnitSearchNames()
  const objectiveLabel = useObjectiveLabel()
  const [search, setSearch] = useState("")
  const [onlyUnlocked, setOnlyUnlocked] = useState(onlyUnlockedDefault)
  const [selectedObjectives, setSelectedObjectives] = useState<number[]>(() => [
    ...initialObjectives,
  ])
  const [sort, setSort] = useState<PickerSort>("power")
  const describedByPrefix = useId()
  const [preview, setPreview] = useState(
    Boolean(goalsPreview?.available && goalsPreview.enabled)
  )
  const previewOn = Boolean(goalsPreview?.available && preview)
  const shownRoster = previewOn ? goalsPreview?.roster : roster
  const rosterById = useMemo(
    () =>
      new Map((shownRoster ?? []).map((unit) => [unit.unitId as string, unit])),
    [shownRoster]
  )
  const number = new Intl.NumberFormat(i18n.language)
  const nameOf = (unit: { id: string }) => unitName("Character", unit.id)
  const powerConfig =
    estimates !== "pending" && estimates?.config?.unitPower
      ? estimates.config
      : undefined
  // Power reads the shown roster (synced or Goals Preview); without power data the sort falls back
  // to Points left (spec: the picker has a Points left / Power sort).
  const shownSort: PickerSort = powerConfig ? sort : "pointsLeft"
  const hordeTiers =
    estimates === "pending" ? undefined : estimates?.config?.hordeTiers
  const tiles = useMemo(
    () =>
      buildPickerTiles(
        lane,
        units,
        shownRoster,
        (unit) => unitName("Character", unit.id),
        selectedObjectives,
        {
          progress,
          sort: shownSort,
          powerOf: powerConfig
            ? (unitId) => unitEffectivePower(unitId, rosterById, powerConfig)
            : undefined,
        }
      ),
    [
      lane,
      units,
      shownRoster,
      unitName,
      rosterById,
      selectedObjectives,
      progress,
      shownSort,
      powerConfig,
    ]
  )
  /** A shown unit's estimated clears: the preview roster's while Goals Preview is on. */
  const clearsOf = (unitId: string): number | null | "pending" => {
    if (previewOn) return goalsPreview?.clearsOf?.(unitId) ?? null
    if (estimates === "pending") return "pending"
    return estimates?.clearsOf(unitId) ?? null
  }
  const selected = new Set([
    ...memberUnitIds,
    ...(reserveUnitId ? [reserveUnitId] : []),
  ])
  const shown = filterPickerTiles(tiles, {
    search,
    onlyUnlocked,
    selected,
    nameOf,
    searchNamesOf,
  })
  const dividerAt = notMatchingStart(shown, selectedObjectives)
  // A saved member or reserve the lane no longer allows has no tile: list it with a remove button
  // so the team can still be fixed and saved.
  const tiled = new Set(tiles.map((tile) => tile.unit.id as string))
  const untiledMembers = memberUnitIds.filter((unitId) => !tiled.has(unitId))
  const untiledReserve =
    reserveUnitId && !tiled.has(reserveUnitId) ? reserveUnitId : null
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  const chipCounts = objectiveChipCounts(
    shown,
    objectives.map((objective) => objective.index),
    selectedObjectives
  )
  const selectedLabels = objectives
    .filter((objective) => selectedObjectives.includes(objective.index))
    .map((objective) => ({
      index: objective.index,
      label: objectiveLabel(objective).label,
    }))

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="team-unit-picker">
      {untiledMembers.length > 0 || untiledReserve ? (
        <ul
          className="flex min-w-0 flex-wrap gap-1.5"
          data-testid="team-picker-selected"
        >
          {untiledMembers.map((unitId) => (
            <SelectedChip
              key={unitId}
              label={nameOf({ id: unitId })}
              onRemove={() => onToggleMember(unitId)}
              removeLabel={t("teams.picker.remove", {
                name: nameOf({ id: unitId }),
              })}
              unitId={unitId}
            />
          ))}
          {untiledReserve ? (
            <SelectedChip
              key={`reserve-${untiledReserve}`}
              label={`${nameOf({ id: untiledReserve })} · ${t("teams.reserve")}`}
              onRemove={() => onToggleReserve(untiledReserve)}
              removeLabel={t("teams.picker.unsetReserve", {
                name: nameOf({ id: untiledReserve }),
              })}
              reserve
              unitId={untiledReserve}
            />
          ) : null}
        </ul>
      ) : null}
      {memberUnitIds.length === MAX_TEAM_MEMBERS ? (
        <p className="text-xs text-muted-foreground">
          {t("teams.picker.full")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label={t("teams.picker.search")}
          className="max-w-xs"
          data-testid="team-picker-search"
          ref={searchInputRef}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("teams.picker.searchPlaceholder")}
          type="search"
          value={search}
        />
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={onlyUnlocked}
            data-testid="team-picker-only-unlocked"
            onCheckedChange={setOnlyUnlocked}
          />
          {t("teams.picker.onlyUnlocked")}
        </label>
        <TeamPickerSort
          onChange={setSort}
          powerAvailable={Boolean(powerConfig)}
          value={shownSort}
        />
        {goalsPreview ? (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={previewOn}
              data-testid="team-picker-goals-preview"
              disabled={!goalsPreview.available}
              onCheckedChange={(enabled) => {
                setPreview(enabled)
                goalsPreview.onToggle?.(enabled)
              }}
            />
            {t("goalsPreview.switch")}
          </label>
        ) : null}
      </div>
      <TeamPickerObjectiveChips
        counts={chipCounts}
        objectives={objectives}
        onToggle={(index) =>
          setSelectedObjectives((current) =>
            toggleObjectiveChip(current, index)
          )
        }
        selected={selectedObjectives}
      />
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("teams.picker.empty")}
        </p>
      ) : (
        <ul
          className="grid grid-cols-3 gap-2 md:grid-cols-5"
          data-testid="team-picker-grid"
        >
          {shown.map((tile, at) => {
            const id = tile.unit.id
            const isMember = memberUnitIds.includes(id)
            const isReserve = reserveUnitId === id
            const name = nameOf(tile.unit)
            // Rarity, rank and clears for every unit the shown roster holds (spec: picker tiles
            // show each owned unit's strength); the preview marker stays preview-only.
            const shownUnit =
              tile.owned === true ? rosterById.get(id) : undefined
            const previewed = previewOn && goalsPreview?.previewed.has(id)
            const clears = shownUnit ? clearsOf(id) : null
            const lines = goalLines?.(id) ?? []
            const dimmed = !tile.matches
            const missing = selectedLabels
              .filter((entry) => !tile.satisfied.includes(entry.index))
              .map((entry) => entry.label)
            const missingId = `${describedByPrefix}-${id}`
            return (
              <Fragment key={id}>
                {at === dividerAt ? (
                  <li
                    className="col-span-full flex items-center gap-2 py-1 text-xs text-muted-foreground"
                    data-testid="team-picker-not-matching-divider"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 bg-border"
                    />
                    {t("teams.picker.notMatchingDivider")}
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 bg-border"
                    />
                  </li>
                ) : null}
                <li
                  className={cn(
                    "relative flex min-w-0 flex-col items-stretch rounded-xl border bg-card",
                    isMember &&
                      "border-primary bg-primary/15 ring-2 ring-primary",
                    isReserve && "border-dashed border-primary bg-primary/5",
                    // Fade the whole tile (not a background tint, which reads lighter than
                    // `bg-card` in dark mode) so not-matching units clearly recede; hover and
                    // focus bring a tile back so it stays readable while choosing it.
                    dimmed &&
                      !isMember &&
                      !isReserve &&
                      "opacity-45 transition-opacity focus-within:opacity-100 hover:opacity-100"
                  )}
                  data-dimmed={dimmed ? "true" : undefined}
                  data-locked={tile.owned === false ? "true" : undefined}
                  data-preview={previewed ? "true" : undefined}
                  data-reserve={isReserve ? "true" : undefined}
                  data-selected={isMember ? "true" : undefined}
                  data-testid="team-picker-tile"
                  data-unit={id}
                >
                  <button
                    aria-label={t(
                      isMember ? "teams.picker.remove" : "teams.picker.add",
                      { name }
                    )}
                    aria-describedby={dimmed ? missingId : undefined}
                    aria-pressed={isMember}
                    className="flex min-w-0 flex-col items-center gap-1 p-1.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="team-picker-toggle"
                    onClick={() => onToggleMember(id)}
                    type="button"
                  >
                    {dimmed ? (
                      <span className="sr-only" id={missingId}>
                        {t("teams.picker.doesNotSatisfy", {
                          objectives: missing.join(", "),
                        })}
                      </span>
                    ) : null}
                    <span className="relative">
                      <EntityIcon
                        alt=""
                        className={cn(
                          "size-10 rounded-full",
                          tile.owned === false && "opacity-50 grayscale"
                        )}
                        src={characterIcon(id)}
                      />
                      {tile.owned === false ? (
                        <EntityIcon
                          src={lockIcon()}
                          alt={t("teams.picker.locked")}
                          className="absolute -right-1 -bottom-1 size-3.5 rounded-full bg-background p-0.5"
                        />
                      ) : null}
                    </span>
                    <span className="flex w-full min-w-0 items-center justify-center gap-0.5">
                      <span className="truncate text-xs font-medium">
                        {name}
                      </span>
                      {lines.length > 0 ? (
                        <UnitGoalBadge
                          className="size-4"
                          label={t("goalBadge.label")}
                          lines={lines}
                          tooltip={false}
                        />
                      ) : null}
                    </span>
                    {shownUnit ? (
                      <TeamPickerUnitState
                        clears={clears}
                        previewed={Boolean(previewed)}
                        unit={shownUnit}
                      />
                    ) : null}
                    <span className="flex flex-wrap justify-center gap-0.5">
                      {objectives.map((objective) => (
                        <ObjectiveIcon
                          className="size-4"
                          icon={objectiveLabel(objective).icon}
                          key={objective.index}
                          muted={!tile.satisfied.includes(objective.index)}
                        />
                      ))}
                    </span>
                    <span
                      className="text-xs text-muted-foreground tabular-nums"
                      data-testid="team-picker-points"
                      title={t("teams.picker.pointsScope")}
                    >
                      {t("teams.picker.points", {
                        points: number.format(tile.remainingPoints),
                      })}
                    </span>
                  </button>
                  <TeamPickerTileMarkers
                    tier={hordeTiers?.get(id) ?? null}
                    traits={tile.unit.traits}
                  />
                  <Button
                    aria-label={t(
                      isReserve
                        ? "teams.picker.unsetReserve"
                        : "teams.picker.setReserve",
                      { name }
                    )}
                    aria-pressed={isReserve}
                    className="absolute top-0.5 right-0.5"
                    data-testid="team-picker-reserve"
                    onClick={() => onToggleReserve(id)}
                    size="icon-xs"
                    title={t("teams.reserve")}
                    type="button"
                    variant={isReserve ? "secondary" : "ghost"}
                  >
                    <ShieldPlus />
                  </Button>
                </li>
              </Fragment>
            )
          })}
        </ul>
      )}
    </div>
  )
}
