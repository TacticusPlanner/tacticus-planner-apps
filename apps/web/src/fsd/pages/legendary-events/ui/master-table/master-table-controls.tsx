import { useId } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
import { Spinner } from "@workspace/ui/components/spinner"

import type {
  MasterTablePointsMode,
  MasterTableUnitSet,
} from "@/entities/legendary-event"
import {
  EntityIcon,
  PageToolbar,
  SearchField,
  SegmentedControl,
  useViewPlacement,
} from "@/shared/ui"

import { POINTS_MODES, UNIT_SETS } from "./master-table.view-model"
import type {
  EstimatedAvailability,
  MasterTablePickerEvent,
  MasterTableState,
  UnitSetAvailability,
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
 * The master table's toolbar (ui-style-guide rule 2): Find holds the search and the event picker;
 * View holds the Units and Points segmented controls (on mobile behind the View button, whose sheet
 * also has Sort by, as the card list has no sortable headers). Notes on why a choice is disabled
 * sit under the row. Tour targets keep the same test ids on both forms.
 */
export function MasterTableControls(props: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <PageToolbar
      below={<ControlHints {...props} />}
      find={
        <>
          <MasterTableSearch {...props} />
          <Popover>
            <PopoverTrigger asChild>
              <Button data-testid="master-table-events" variant="outline">
                {t("masterTable.events.trigger", {
                  count: props.state.selectedEventIds.length,
                })}
                <ChevronDown aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-(--radix-popover-content-available-height) w-72 overflow-y-auto p-2"
            >
              <EventPickerList {...props} />
            </PopoverContent>
          </Popover>
        </>
      }
      testId="master-table-controls"
      view={
        <>
          <UnitSetControl {...props} />
          <PointsModeControl {...props} />
          <SortSelect {...props} />
        </>
      }
      viewTestId="master-table-view"
    />
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
      <span className="text-sm font-medium">{label}</span>
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
        size="inline"
        alt=""
        className="shrink-0 rounded-full"
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
  const loadingLabel = (set: MasterTableUnitSet) =>
    set === "unlocked" && unitSets.unlocked === "loading"
      ? t("masterTable.unitSet.rosterLoading")
      : set === "inTeams" && unitSets.inTeams === "loading"
        ? t("masterTable.unitSet.teamsLoading")
        : null
  return (
    <SegmentedControl
      label={t("masterTable.unitSet.label")}
      onValueChange={onUnitSetChange}
      options={UNIT_SETS.map((set) => {
        const loading = loadingLabel(set)
        return {
          value: set,
          label: t(`masterTable.unitSet.${set}`),
          testId: `master-table-unit-set-${set}`,
          disabled:
            (set === "unlocked" && unitSets.unlocked !== "ready") ||
            (set === "inTeams" && unitSets.inTeams !== "ready"),
          trailing: loading ? (
            <Spinner aria-label={loading} className="size-3" />
          ) : undefined,
        }
      })}
      testId="master-table-unit-set"
      value={state.unitSet}
    />
  )
}

function PointsModeControl({
  state,
  estimated,
  onPointsChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <SegmentedControl
      label={t("masterTable.points.label")}
      onValueChange={onPointsChange}
      options={POINTS_MODES.map((mode) => ({
        value: mode,
        label: t(`masterTable.points.${mode}`),
        testId: `master-table-points-${mode}`,
        disabled: mode === "estimated" && estimated !== "ready",
        trailing:
          mode === "estimated" && estimated === "loading" ? (
            <Spinner
              aria-label={t("masterTable.points.estimatesLoading")}
              className="size-3"
            />
          ) : undefined,
      }))}
      testId="master-table-points-mode"
      value={state.points}
    />
  )
}

/** Why a Units or Points choice is disabled: each cause on its own line under the toolbar. */
function ControlHints({ unitSets, estimated }: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  // Both unit-set causes can hold at once (no roster and failed plans).
  const unitSetHints = [
    unitSets.unlocked === "noRoster" ? t("masterTable.unitSet.noRoster") : null,
    unitSets.inTeams === "failed"
      ? t("masterTable.unitSet.teamsUnavailable")
      : null,
  ].filter((hint): hint is string => hint !== null)
  const pointsHint =
    estimated === "unavailable"
      ? t("masterTable.points.needsEstimates")
      : estimated === "noRoster" && unitSets.unlocked !== "noRoster"
        ? t("masterTable.unitSet.noRoster")
        : null
  if (unitSetHints.length === 0 && !pointsHint) return null
  return (
    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
      {unitSetHints.map((hint) => (
        <span data-testid="master-table-unit-set-hint" key={hint}>
          {hint}
        </span>
      ))}
      {pointsHint ? (
        <span data-testid="master-table-points-hint">{pointsHint}</span>
      ) : null}
    </div>
  )
}

function MasterTableSearch({ state, onQueryChange }: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <SearchField
      label={t("masterTable.search.label")}
      onChange={onQueryChange}
      testId="master-table-search"
      value={state.q}
    />
  )
}

function SortSelect({
  state,
  eventName,
  onSortChange,
}: MasterTableControlsProps) {
  const { t } = useTranslation("legendaryEvents")
  // The desktop table sorts from its headers; only the mobile View sheet needs this.
  if (useViewPlacement() !== "sheet") return null
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
          className="w-full"
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
