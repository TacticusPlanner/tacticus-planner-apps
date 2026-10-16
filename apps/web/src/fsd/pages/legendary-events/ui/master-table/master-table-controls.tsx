import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
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
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type {
  MasterTablePointsMode,
  MasterTableUnitSet,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import {
  POINTS_MODES,
  UNIT_SETS,
  type EstimatedAvailability,
  type MasterTablePickerEvent,
  type MasterTableState,
  type UnitSetAvailability,
} from "./master-table.view-model"

const SORT_TOTAL = "__total"

export interface MasterTableControlsProps {
  state: MasterTableState
  pickerEvents: readonly MasterTablePickerEvent[]
  eventName: (eventId: string) => string
  unitSets: UnitSetAvailability
  estimated: EstimatedAvailability
  onEventsChange: (eventIds: string[]) => void
  onUnitSetChange: (unitSet: MasterTableUnitSet) => void
  onPointsChange: (points: MasterTablePointsMode) => void
  onSortChange: (eventId: string | null) => void
  onQueryChange: (query: string) => void
}

/**
 * The master table's controls (design D5): on desktop one row (event picker popover, unit set,
 * points mode, search); on mobile a bar with the search and a Controls button opening a bottom
 * sheet with the picker, unit set, points mode and Sort by. Tour targets keep the same test ids on
 * both forms.
 */
export function MasterTableControls({
  isMobile,
  controlsOpen,
  onControlsOpenChange,
  ...props
}: MasterTableControlsProps & {
  isMobile: boolean
  controlsOpen: boolean
  onControlsOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  if (!isMobile) {
    return (
      <div
        className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-3"
        data-testid="master-table-controls"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button data-testid="master-table-events" variant="outline">
              {t("masterTable.events.trigger", {
                count: props.state.selectedEventIds.length,
              })}
              <ChevronDown aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <EventPickerList {...props} />
          </PopoverContent>
        </Popover>
        <UnitSetControl {...props} />
        <PointsModeControl {...props} />
        <SearchField {...props} />
      </div>
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <SearchField {...props} />
      <Button
        className="min-h-11 shrink-0"
        data-testid="master-table-controls"
        onClick={() => onControlsOpenChange(true)}
        variant="outline"
      >
        <SlidersHorizontal aria-hidden="true" />
        {t("masterTable.controls.open")}
      </Button>
      <Sheet onOpenChange={onControlsOpenChange} open={controlsOpen}>
        <SheetContent
          className="max-h-[85vh] overflow-y-auto"
          data-testid="master-table-controls-sheet"
          side="bottom"
        >
          <SheetHeader>
            <SheetTitle>{t("masterTable.controls.title")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <ControlField label={t("masterTable.events.label")}>
              <div data-testid="master-table-events">
                <EventPickerList {...props} />
              </div>
            </ControlField>
            <UnitSetControl {...props} />
            <PointsModeControl {...props} />
            <SortSelect {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ControlField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function EventPickerList({
  pickerEvents,
  eventName,
  state,
  onEventsChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  const selected = new Set(state.selectedEventIds)
  const toggle = (eventId: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(eventId)
    else next.delete(eventId)
    onEventsChange(
      pickerEvents.map((event) => event.id).filter((id) => next.has(id))
    )
  }
  const current = pickerEvents.filter((event) => !event.archived)
  const archived = pickerEvents.filter((event) => event.archived)
  const item = (event: MasterTablePickerEvent) => (
    <EventPickerItem
      checked={selected.has(event.id)}
      eventId={event.id}
      key={event.id}
      name={eventName(event.id)}
      onCheckedChange={(checked) => toggle(event.id, checked)}
    />
  )
  return (
    <ul className="flex flex-col" data-testid="master-table-event-list">
      {current.map(item)}
      {archived.length > 0 ? (
        <li
          className="mt-1 border-t pt-2 pb-1 text-xs font-medium text-muted-foreground"
          data-testid="master-table-archived-divider"
          role="presentation"
        >
          {t("masterTable.events.archived")}
        </li>
      ) : null}
      {archived.map(item)}
    </ul>
  )
}

function EventPickerItem({
  eventId,
  name,
  checked,
  onCheckedChange,
}: {
  eventId: string
  name: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <li
      className="flex min-h-11 items-center gap-2 rounded-md px-2 md:min-h-9"
      data-event={eventId}
      data-testid="master-table-event-option"
    >
      <Checkbox
        checked={checked}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <EntityIcon
        alt=""
        className="size-6 shrink-0 rounded-full"
        src={characterIcon(eventId as UnitId)}
      />
      <Label className="min-w-0 flex-1 truncate font-normal" htmlFor={id}>
        {name}
      </Label>
    </li>
  )
}

function UnitSetControl({
  state,
  unitSets,
  onUnitSetChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  const hint =
    unitSets.inTeams === "failed"
      ? t("masterTable.unitSet.teamsUnavailable")
      : unitSets.unlocked === "noRoster"
        ? t("masterTable.unitSet.noRoster")
        : null
  return (
    <ControlField label={t("masterTable.unitSet.label")}>
      <ToggleGroup
        aria-label={t("masterTable.unitSet.label")}
        data-testid="master-table-unit-set"
        onValueChange={(value) => {
          const next = UNIT_SETS.find((entry) => entry === value)
          if (next) onUnitSetChange(next)
        }}
        size="sm"
        type="single"
        value={state.unitSet}
        variant="outline"
      >
        {UNIT_SETS.map((set) => (
          <ToggleGroupItem
            data-testid={`master-table-unit-set-${set}`}
            disabled={
              (set === "unlocked" && unitSets.unlocked !== "ready") ||
              (set === "inTeams" && unitSets.inTeams !== "ready")
            }
            key={set}
            value={set}
          >
            {t(`masterTable.unitSet.${set}`)}
            {set === "inTeams" && unitSets.inTeams === "loading" ? (
              <Spinner
                aria-label={t("masterTable.unitSet.teamsLoading")}
                className="size-3"
              />
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint ? (
        <span
          className="text-xs text-muted-foreground"
          data-testid="master-table-unit-set-hint"
        >
          {hint}
        </span>
      ) : null}
    </ControlField>
  )
}

function PointsModeControl({
  state,
  estimated,
  onPointsChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  const hint =
    estimated === "unavailable"
      ? t("masterTable.points.needsEstimates")
      : estimated === "noRoster"
        ? t("masterTable.unitSet.noRoster")
        : null
  return (
    <ControlField label={t("masterTable.points.label")}>
      <ToggleGroup
        aria-label={t("masterTable.points.label")}
        data-testid="master-table-points-mode"
        onValueChange={(value) => {
          const next = POINTS_MODES.find((entry) => entry === value)
          if (next) onPointsChange(next)
        }}
        size="sm"
        type="single"
        value={state.points}
        variant="outline"
      >
        {POINTS_MODES.map((mode) => (
          <ToggleGroupItem
            data-testid={`master-table-points-${mode}`}
            disabled={mode === "estimated" && estimated !== "ready"}
            key={mode}
            value={mode}
          >
            {t(`masterTable.points.${mode}`)}
            {mode === "estimated" && estimated === "loading" ? (
              <Spinner
                aria-label={t("masterTable.points.estimatesLoading")}
                className="size-3"
              />
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint ? (
        <span
          className="text-xs text-muted-foreground"
          data-testid="master-table-points-hint"
        >
          {hint}
        </span>
      ) : null}
    </ControlField>
  )
}

function SearchField({ state, onQueryChange }: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div className="relative min-w-0 flex-1 md:max-w-64 md:self-end">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={t("masterTable.search.label")}
        className="min-h-11 pl-8 md:min-h-9"
        data-testid="master-table-search"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t("masterTable.search.placeholder")}
        type="search"
        value={state.q}
      />
    </div>
  )
}

function SortSelect({
  state,
  eventName,
  onSortChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <ControlField label={t("masterTable.sort.label")}>
      <Select
        onValueChange={(value) =>
          onSortChange(value === SORT_TOTAL ? null : value)
        }
        value={state.sort ?? SORT_TOTAL}
      >
        <SelectTrigger
          aria-label={t("masterTable.sort.label")}
          className="min-h-11 w-full"
          data-testid="master-table-sort"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SORT_TOTAL}>
            {t("masterTable.sort.total")}
          </SelectItem>
          {state.selectedEventIds.map((eventId) => (
            <SelectItem key={eventId} value={eventId}>
              {eventName(eventId)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ControlField>
  )
}
