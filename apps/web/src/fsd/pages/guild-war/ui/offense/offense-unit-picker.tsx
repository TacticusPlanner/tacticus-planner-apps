import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  TeamPickerFilterFields,
  TeamPickerGrid,
  activeFilterCount,
  defaultPickerFilters,
  filterPickerUnits,
  pickerFilterOptions,
} from "@/features/team-editor"
import type { PickerTileState, PickerUnit } from "@/features/team-editor"
import type { TeamRoster } from "@/entities/team"
import {
  FilterField,
  FiltersControl,
  ListDivider,
  SearchField,
} from "@/shared/ui"

import type { GuildWarSeason } from "../../lib/season"
import {
  CHARACTER_PREVIEW,
  MAX_ATTACK_CHARACTERS,
  MAX_ATTACK_MOWS,
  kindFull,
  previewCharacters,
} from "../../model/offense"
import type { Selection } from "../../model/offense"
import type { OffenseFilters } from "../../model/offense-filters"
import { useGuildWarNames } from "../../model/use-guild-war-names"

const NO_LOCKS: ReadonlySet<string> = new Set()
const NO_USAGE: ReadonlyMap<string, string[]> = new Map()
const CHARACTER_COLUMNS =
  "grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5 @3xl:grid-cols-6 @5xl:grid-cols-8"
const MOW_COLUMNS = "grid-cols-3 @md:grid-cols-4 @xl:grid-cols-6"

/** A switch inside the Filters panel, label and control on one line. */
function FilterSwitch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  hint,
  testId,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  hint?: string
  testId: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <FilterField inline label={label}>
        {({ id }) => (
          <Switch
            checked={checked}
            data-testid={testId}
            disabled={disabled}
            id={id}
            onCheckedChange={onCheckedChange}
          />
        )}
      </FilterField>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/**
 * The units that can attack, in the team editor's tiles capped at the defenders' rarity: a search
 * and the Filters dialog (Owned only and Show deployed at the top, then the team picker's fields),
 * the characters (the first 30 on desktop, 12 on phones, then Show all; a search or filter shows
 * every match), every Machine of War, and with Show deployed the units that already attacked,
 * dimmed and flagged with their zone. Once an attack has 5 characters (or 1 Machine of War) the
 * other tiles of that kind are blocked and say why.
 */
export function OffenseUnitPicker({
  units,
  roster,
  cap,
  season,
  deployed,
  filters,
  onFiltersChange,
  selection,
  onToggle,
}: {
  units: readonly PickerUnit[]
  roster: TeamRoster | null
  cap: Rarity
  season: GuildWarSeason | undefined
  /** Each deployed unit and the zone it attacked. */
  deployed: ReadonlyMap<string, string>
  filters: OffenseFilters
  onFiltersChange: (patch: Partial<OffenseFilters>) => void
  selection: Selection
  onToggle: (unit: PickerUnit) => void
}) {
  const { t, i18n } = useTranslation(["guildWar", "teams"])
  const { zoneName } = useGuildWarNames()
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const options = useMemo(() => pickerFilterOptions(units), [units])
  const shown = useMemo(
    () =>
      filterPickerUnits(units, filters, {
        allowedFactions: undefined,
        mows: true,
        locale: i18n.language,
      }),
    [units, filters, i18n.language]
  )
  const available = shown.filter((unit) => !deployed.has(unit.id))
  const characters = available.filter((unit) => unit.kind === "character")
  const mows = available.filter((unit) => unit.kind === "mow")
  const deployedShown = filters.showDeployed
    ? shown.filter((unit) => deployed.has(unit.id))
    : []
  const narrowed =
    filters.search.trim() !== "" || activeFilterCount(filters) > 0
  const preview = previewCharacters(characters, {
    expanded,
    narrowed,
    limit: isMobile ? CHARACTER_PREVIEW.phone : CHARACTER_PREVIEW.desktop,
  })
  const selectedIds = new Set(selection.keys())
  const charactersFull = kindFull(selection, "character")
  const mowsFull = kindFull(selection, "mow")

  const availableState = (unit: PickerUnit): PickerTileState | undefined => {
    if (selection.has(unit.id)) return undefined
    if (unit.kind === "character" && charactersFull) {
      return {
        blockedReason: t("guildWar:units.charactersFull", {
          count: MAX_ATTACK_CHARACTERS,
        }),
      }
    }
    if (unit.kind === "mow" && mowsFull) {
      return {
        blockedReason: t("guildWar:units.mowsFull", { count: MAX_ATTACK_MOWS }),
      }
    }
    return undefined
  }
  const deployedState = (unit: PickerUnit): PickerTileState => {
    const zone = zoneName(season, deployed.get(unit.id) ?? "")
    return {
      blockedReason: t("guildWar:units.deployedIn", { zone }),
      dimmed: true,
      note: (
        <span
          className="flex w-full min-w-0 items-center justify-center gap-1 text-xs text-muted-foreground"
          data-testid="guild-war-deployed-zone"
        >
          <Flag aria-hidden="true" className="size-icon-xs shrink-0" />
          <span className="truncate">{zone}</span>
        </span>
      ),
    }
  }
  const grid = (
    list: readonly PickerUnit[],
    testId: string,
    columns: string,
    tileState: (unit: PickerUnit) => PickerTileState | undefined
  ) => (
    <TeamPickerGrid
      columns={columns}
      lockedIds={NO_LOCKS}
      onToggle={onToggle}
      rarityCap={cap}
      roster={roster}
      selectedIds={selectedIds}
      testId={testId}
      tileState={tileState}
      units={list}
      usage={NO_USAGE}
    />
  )
  const filterCount =
    activeFilterCount(filters) +
    (filters.ownedOnly ? 1 : 0) +
    (filters.showDeployed ? 1 : 0)

  return (
    <div className="flex flex-col gap-3" data-testid="guild-war-unit-picker">
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          label={t("teams:picker.search")}
          onChange={(search) => onFiltersChange({ search })}
          value={filters.search}
        />
        <FiltersControl
          count={filterCount}
          onClear={() =>
            onFiltersChange({
              ...defaultPickerFilters,
              search: filters.search,
              showDeployed: false,
            })
          }
          size="form"
          testId="guild-war-filters"
        >
          <FilterSwitch
            checked={roster !== null && filters.ownedOnly}
            disabled={roster === null}
            hint={
              roster === null
                ? t("teams:picker.ownedOnlyNeedsRoster")
                : undefined
            }
            label={t("teams:picker.ownedOnly")}
            onCheckedChange={(ownedOnly) => onFiltersChange({ ownedOnly })}
            testId="guild-war-owned-only"
          />
          <FilterSwitch
            checked={filters.showDeployed}
            label={t("guildWar:units.showDeployed")}
            onCheckedChange={(showDeployed) =>
              onFiltersChange({ showDeployed })
            }
            testId="guild-war-show-deployed"
          />
          <TeamPickerFilterFields
            className="grid-cols-2"
            filters={filters}
            onChange={onFiltersChange}
            options={options}
          />
        </FiltersControl>
      </div>
      {available.length === 0 && deployedShown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("teams:picker.empty")}
        </p>
      ) : null}
      {/* Tiles lay out by the room they get, as in the team editor. */}
      <div className="@container flex flex-col gap-4">
        {characters.length > 0 ? (
          <section
            aria-labelledby="guild-war-characters-heading"
            className="flex flex-col gap-1.5"
          >
            <h3
              className="text-sm font-medium"
              id="guild-war-characters-heading"
            >
              {t("teams:picker.characters")}
            </h3>
            {grid(
              preview.shown,
              "guild-war-characters",
              CHARACTER_COLUMNS,
              availableState
            )}
            {preview.hidden > 0 ? (
              <Button
                className="self-start"
                onClick={() => setExpanded(true)}
                variant="outline"
              >
                {t("guildWar:units.showAll", { count: characters.length })}
              </Button>
            ) : null}
          </section>
        ) : null}
        {mows.length > 0 ? (
          <section
            aria-labelledby="guild-war-mows-heading"
            className="flex scroll-mt-4 flex-col gap-1.5"
            id="guild-war-mows"
          >
            <h3 className="text-sm font-medium" id="guild-war-mows-heading">
              {t("teams:picker.mows")}
            </h3>
            {grid(mows, "guild-war-mows", MOW_COLUMNS, availableState)}
          </section>
        ) : null}
        {deployedShown.length > 0 ? (
          <section className="flex flex-col gap-1.5">
            <ListDivider heading="h3" label={t("guildWar:units.deployed")} />
            {grid(
              deployedShown,
              "guild-war-deployed",
              CHARACTER_COLUMNS,
              deployedState
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}
