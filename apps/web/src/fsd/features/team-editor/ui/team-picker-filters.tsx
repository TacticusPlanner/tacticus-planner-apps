import { useId } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import {
  allianceIcon,
  damageTypeIcon,
  factionIcon,
  rankIcon,
  rarityIcon,
  traitIcon,
} from "@workspace/game-catalog"
import { rankOrder, rarityOrder } from "@workspace/game-domain"
import type { Rank, Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, FilterField, FiltersButton } from "@/shared/ui"
import type { FilterLabelIconKind } from "@/shared/ui"

import { activeFilterCount, defaultPickerFilters } from "../model/unit-picker"
import { useOverlayPortal } from "./use-overlay-portal"
import type {
  AttackType,
  PickerFilters,
  pickerFilterOptions,
} from "../model/unit-picker"

const ANY = "any"

const numbers = (values: readonly number[]) =>
  values.map((value) => ({ value, label: String(value) }))

/** A labelled select (`FilterField`, led by the filter's game icon) whose "any" choice clears it. */
function FilterSelect<T extends string | number>({
  label,
  icon,
  value,
  anyLabel,
  options,
  onChange,
  testId,
}: {
  label: string
  icon?: FilterLabelIconKind
  value: T | null
  anyLabel: string
  /** Each choice, with its game icon when it is a game entity (ui-style-guide rule 3). */
  options: readonly { value: T; label: string; icon?: string }[]
  onChange: (value: T | null) => void
  testId: string
}) {
  const { triggerRef, container, onOpenChange } = useOverlayPortal()
  return (
    <FilterField icon={icon} label={label}>
      {({ labelId }) => (
        <Select
          onOpenChange={onOpenChange}
          onValueChange={(next) =>
            onChange(
              next === ANY
                ? null
                : (options.find((option) => String(option.value) === next)
                    ?.value ?? null)
            )
          }
          value={value === null ? ANY : String(value)}
        >
          <SelectTrigger
            aria-labelledby={labelId}
            className="w-full"
            data-testid={testId}
            ref={triggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={container} position="popper">
            <SelectItem value={ANY}>{anyLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.icon ? (
                  <EntityIcon alt="" size="icon" src={option.icon} />
                ) : null}
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FilterField>
  )
}

function FilterFields({
  filters,
  options,
  onChange,
  className,
}: {
  className?: string
  filters: PickerFilters
  options: ReturnType<typeof pickerFilterOptions>
  onChange: (patch: Partial<PickerFilters>) => void
}) {
  const { t } = useTranslation([
    "teams",
    "progression",
    "factions",
    "traits",
    "damageTypes",
    "common",
  ])
  const ranks = rankOrder.map((rank) => ({
    value: rank,
    label: t(`progression:ranks.${rank}`),
    icon: rankIcon(rank),
  }))
  const rarities = rarityOrder.map((rarity) => ({
    value: rarity,
    label: t(`progression:rarities.${rarity}`),
    icon: rarityIcon(rarity),
  }))
  const iconOf = {
    factions: factionIcon,
    traits: traitIcon,
    damageTypes: damageTypeIcon,
  }
  const named = (
    namespace: "factions" | "traits" | "damageTypes",
    values: readonly string[]
  ) =>
    values
      .map((value) => ({
        value,
        label: t(`${namespace}:${value}`, { defaultValue: value }),
        icon: iconOf[namespace](value),
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label))
  return (
    <div
      className={cn("grid gap-3", className)}
      data-testid="team-picker-filter-fields"
    >
      <FilterSelect<Rank>
        anyLabel={t("picker.any")}
        label={`${t("picker.rank")} · ${t("picker.from")}`}
        onChange={(rankMin) => onChange({ rankMin })}
        options={ranks}
        icon="rank"
        testId="team-filter-rank-min"
        value={filters.rankMin}
      />
      <FilterSelect<Rank>
        anyLabel={t("picker.any")}
        label={`${t("picker.rank")} · ${t("picker.to")}`}
        onChange={(rankMax) => onChange({ rankMax })}
        options={ranks}
        icon="rank"
        testId="team-filter-rank-max"
        value={filters.rankMax}
      />
      <FilterSelect<Rarity>
        anyLabel={t("picker.any")}
        label={`${t("picker.rarity")} · ${t("picker.from")}`}
        onChange={(rarityMin) => onChange({ rarityMin })}
        options={rarities}
        icon="rarity"
        testId="team-filter-rarity-min"
        value={filters.rarityMin}
      />
      <FilterSelect<Rarity>
        anyLabel={t("picker.any")}
        label={`${t("picker.rarity")} · ${t("picker.to")}`}
        onChange={(rarityMax) => onChange({ rarityMax })}
        options={rarities}
        icon="rarity"
        testId="team-filter-rarity-max"
        value={filters.rarityMax}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allFactions")}
        label={t("picker.faction")}
        onChange={(faction) => onChange({ faction })}
        options={named("factions", options.factions)}
        icon="faction"
        testId="team-filter-faction"
        value={filters.faction}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allAlliances")}
        label={t("picker.alliance")}
        onChange={(alliance) => onChange({ alliance })}
        options={options.alliances.map((alliance) => ({
          value: alliance,
          label: t(`common:alliances.${alliance as "Imperial"}`, {
            defaultValue: alliance,
          }),
          icon: allianceIcon(alliance),
        }))}
        icon="alliance"
        testId="team-filter-alliance"
        value={filters.alliance}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allTraits")}
        label={t("picker.trait")}
        onChange={(trait) => onChange({ trait })}
        options={named("traits", options.traits)}
        icon="trait"
        testId="team-filter-trait"
        value={filters.trait}
      />
      <FilterField
        className="col-span-full"
        icon="attackType"
        label={t("picker.attackType")}
      >
        {({ labelId }) => (
          <ToggleGroup
            aria-labelledby={labelId}
            className="w-full"
            onValueChange={(value) => {
              if (value) onChange({ attackType: value as AttackType })
            }}
            spacing={0}
            type="single"
            value={filters.attackType}
            variant="outline"
          >
            {(["any", "melee", "ranged"] as const).map((type) => (
              <ToggleGroupItem
                className="flex-auto"
                data-testid={`team-filter-attack-${type}`}
                key={type}
                value={type}
              >
                {t(type === "any" ? "picker.anyAttack" : `picker.${type}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </FilterField>
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.hits")}
        onChange={(minHits) => onChange({ minHits })}
        options={numbers([1, 2, 3, 4, 5, 6])}
        icon="hits"
        testId="team-filter-hits"
        value={filters.minHits}
      />
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.movement")}
        onChange={(movement) => onChange({ movement })}
        options={numbers(options.movements)}
        icon="movement"
        testId="team-filter-movement"
        value={filters.movement}
      />
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.range")}
        onChange={(minRange) => onChange({ minRange })}
        options={numbers(options.ranges)}
        icon="attackRange"
        testId="team-filter-range"
        value={filters.minRange}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allDamageTypes")}
        label={t("picker.damageType")}
        onChange={(damageType) => onChange({ damageType })}
        options={named("damageTypes", options.damageTypes)}
        icon="damageType"
        testId="team-filter-damage-type"
        value={filters.damageType}
      />
    </div>
  )
}

/** The "Filters" button: shows or hides the picker's filters panel, with the active count. */
export function TeamPickerFiltersButton({
  filters,
  open,
  onOpenChange,
  panelId,
}: {
  filters: PickerFilters
  open: boolean
  onOpenChange: (open: boolean) => void
  panelId: string
}) {
  return (
    <FiltersButton
      aria-controls={panelId}
      aria-expanded={open}
      count={activeFilterCount(filters)}
      onClick={() => onOpenChange(!open)}
      testId="team-picker-filters"
    />
  )
}

/**
 * The picker's filters (ui-style-guide rule 3). The editor is already a dialog or a sheet and no
 * overlay opens another (rule 8), so the fields sit inline: above the units on a narrow editor,
 * and on a wide one in a last column after the units, under the "Filters" button, scrolling on
 * its own so the units stay in view. It stays next to the button in the reading order.
 * "Clear filters" sits beside the heading. Changes apply as they are made.
 */
export function TeamPickerFiltersPanel({
  filters,
  options,
  onChange,
  open,
  panelId,
}: {
  filters: PickerFilters
  options: ReturnType<typeof pickerFilterOptions>
  onChange: (patch: Partial<PickerFilters>) => void
  /** Closed, the panel renders nothing. */
  open: boolean
  panelId: string
}) {
  const { t } = useTranslation("common")
  const headingId = useId()
  const count = activeFilterCount(filters)
  const clear = () =>
    onChange({
      ...defaultPickerFilters,
      search: filters.search,
      ownedOnly: filters.ownedOnly,
    })

  if (!open) return null
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-lg border p-3 @3xl/editor:order-last @3xl/editor:w-64 @3xl/editor:shrink-0 @3xl/editor:gap-1.5 @3xl/editor:overflow-y-auto @3xl/editor:rounded-none @3xl/editor:border-0 @3xl/editor:border-l @3xl/editor:p-1 @3xl/editor:pl-4"
      data-testid="team-picker-filters-panel"
      id={panelId}
    >
      {/* The heading row keeps the column headings' height, so "Filters" lines up with
          "Characters" and "Machines of War"; the small ghost button overhangs it evenly. */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium" id={headingId}>
          {t("filtersControl.title")}
        </h4>
        <Button
          className="-my-1"
          disabled={count === 0}
          onClick={clear}
          size="xs"
          type="button"
          variant="ghost"
        >
          <X data-icon="inline-start" />
          {t("filtersControl.clear")}
        </Button>
      </div>
      <FilterFields
        className="grid-cols-2 @xl/editor:grid-cols-3 @3xl/editor:grid-cols-1"
        filters={filters}
        onChange={onChange}
        options={options}
      />
    </section>
  )
}
