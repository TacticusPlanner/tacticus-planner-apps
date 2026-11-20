import { useId, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ListFilter } from "lucide-react"
import { rankOrder, rarityOrder } from "@workspace/game-domain"
import type { Rank, Rarity } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { activeFilterCount, defaultPickerFilters } from "../model/unit-picker"
import type {
  AttackType,
  PickerFilters,
  pickerFilterOptions,
} from "../model/unit-picker"

const ANY = "any"

const numbers = (values: readonly number[]) =>
  values.map((value) => ({ value, label: String(value) }))

/** A labelled select whose "any" choice clears the filter. */
function FilterSelect<T extends string | number>({
  label,
  value,
  anyLabel,
  options,
  onChange,
  testId,
}: {
  label: string
  value: T | null
  anyLabel: string
  options: readonly { value: T; label: string }[]
  onChange: (value: T | null) => void
  testId: string
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-medium" id={id}>
        {label}
      </span>
      <Select
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
          aria-labelledby={id}
          className="w-full"
          data-testid={testId}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FilterFields({
  filters,
  options,
  onChange,
}: {
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
  const attackLabelId = useId()
  const ranks = rankOrder.map((rank) => ({
    value: rank,
    label: t(`progression:ranks.${rank}`),
  }))
  const rarities = rarityOrder.map((rarity) => ({
    value: rarity,
    label: t(`progression:rarities.${rarity}`),
  }))
  const named = (
    namespace: "factions" | "traits" | "damageTypes",
    values: readonly string[]
  ) =>
    values
      .map((value) => ({
        value,
        label: t(`${namespace}:${value}`, { defaultValue: value }),
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label))
  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      data-testid="team-picker-filter-fields"
    >
      <FilterSelect<Rank>
        anyLabel={t("picker.any")}
        label={`${t("picker.rank")} · ${t("picker.from")}`}
        onChange={(rankMin) => onChange({ rankMin })}
        options={ranks}
        testId="team-filter-rank-min"
        value={filters.rankMin}
      />
      <FilterSelect<Rank>
        anyLabel={t("picker.any")}
        label={`${t("picker.rank")} · ${t("picker.to")}`}
        onChange={(rankMax) => onChange({ rankMax })}
        options={ranks}
        testId="team-filter-rank-max"
        value={filters.rankMax}
      />
      <FilterSelect<Rarity>
        anyLabel={t("picker.any")}
        label={`${t("picker.rarity")} · ${t("picker.from")}`}
        onChange={(rarityMin) => onChange({ rarityMin })}
        options={rarities}
        testId="team-filter-rarity-min"
        value={filters.rarityMin}
      />
      <FilterSelect<Rarity>
        anyLabel={t("picker.any")}
        label={`${t("picker.rarity")} · ${t("picker.to")}`}
        onChange={(rarityMax) => onChange({ rarityMax })}
        options={rarities}
        testId="team-filter-rarity-max"
        value={filters.rarityMax}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allFactions")}
        label={t("picker.faction")}
        onChange={(faction) => onChange({ faction })}
        options={named("factions", options.factions)}
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
        }))}
        testId="team-filter-alliance"
        value={filters.alliance}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allTraits")}
        label={t("picker.trait")}
        onChange={(trait) => onChange({ trait })}
        options={named("traits", options.traits)}
        testId="team-filter-trait"
        value={filters.trait}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium" id={attackLabelId}>
          {t("picker.attackType")}
        </span>
        <ToggleGroup
          aria-labelledby={attackLabelId}
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
      </div>
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.hits")}
        onChange={(minHits) => onChange({ minHits })}
        options={numbers([1, 2, 3, 4, 5, 6])}
        testId="team-filter-hits"
        value={filters.minHits}
      />
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.movement")}
        onChange={(movement) => onChange({ movement })}
        options={numbers(options.movements)}
        testId="team-filter-movement"
        value={filters.movement}
      />
      <FilterSelect<number>
        anyLabel={t("picker.any")}
        label={t("picker.range")}
        onChange={(minRange) => onChange({ minRange })}
        options={numbers(options.ranges)}
        testId="team-filter-range"
        value={filters.minRange}
      />
      <FilterSelect<string>
        anyLabel={t("picker.allDamageTypes")}
        label={t("picker.damageType")}
        onChange={(damageType) => onChange({ damageType })}
        options={named("damageTypes", options.damageTypes)}
        testId="team-filter-damage-type"
        value={filters.damageType}
      />
    </div>
  )
}

/**
 * The picker's "Filters" button, badged with the number of active filters: a popover on desktop
 * and a sheet on mobile (ui-style-guide rule 3), holding every filter and a reset.
 */
export function TeamPickerFilters({
  filters,
  options,
  onChange,
}: {
  filters: PickerFilters
  options: ReturnType<typeof pickerFilterOptions>
  onChange: (patch: Partial<PickerFilters>) => void
}) {
  const { t } = useTranslation("teams")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const reset = () =>
    onChange({
      ...defaultPickerFilters,
      search: filters.search,
      lockedUnits: filters.lockedUnits,
    })
  const trigger: ReactNode = (
    <Button
      aria-label={
        count > 0 ? `${t("picker.filters")} (${count})` : t("picker.filters")
      }
      data-testid="team-picker-filters"
      type="button"
      variant="outline"
      {...(isMobile ? { onClick: () => setOpen(true) } : {})}
    >
      <ListFilter data-icon="inline-start" />
      {t("picker.filters")}
      {count > 0 ? (
        <Badge data-testid="team-picker-filters-count">{count}</Badge>
      ) : null}
    </Button>
  )
  const footer = (
    <div className="flex justify-end gap-2">
      <Button onClick={reset} type="button" variant="ghost">
        {t("picker.reset")}
      </Button>
      <Button onClick={() => setOpen(false)} type="button">
        {t("picker.done")}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet onOpenChange={setOpen} open={open}>
          <SheetContent data-testid="team-picker-filters-sheet" side="bottom">
            <SheetHeader>
              <SheetTitle>{t("picker.filtersTitle")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              <FilterFields
                filters={filters}
                onChange={onChange}
                options={options}
              />
              {footer}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-xl max-w-[calc(100vw-2rem)] flex-col gap-4"
        data-testid="team-picker-filters-popover"
      >
        <FilterFields filters={filters} onChange={onChange} options={options} />
        {footer}
      </PopoverContent>
    </Popover>
  )
}
