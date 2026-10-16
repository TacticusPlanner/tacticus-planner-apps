import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  buildMasterTable,
  filterMasterTableRows,
  orderLegendaryEventsForHub,
  sortMasterTable,
  useClearEstimateConfig,
  useLegendaryEventPlans,
  useLegendaryEventRoster,
  useLegendaryEvents,
  useLegendaryEventsBattles,
  useLegendaryEventsProgress,
  useLegendaryEventUnits,
  type MasterTablePointsMode,
  type MasterTableUnitSet,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { MasterTableControls } from "./master-table-controls"
import { MasterTableList } from "./master-table-list"
import { MasterTableTable } from "./master-table-table"
import { useMasterTableTutorial } from "./master-table.tutorial"
import {
  estimatedAvailability,
  masterTableEventInputs,
  masterTableViewSettled,
  nextMasterTableParams,
  parseMasterTableQuery,
  resolveMasterTableState,
  type MasterTablePickerEvent,
  type MasterTableState,
  type UnitSetAvailability,
} from "./master-table.view-model"

/**
 * `/legendary-events/master-table`: every unit's points across the selected events (design D2–D5,
 * D8, D9). The controls live in the URL query; the table (desktop) or card list (mobile) is built
 * once from the entity calculation and then filtered by name and sorted.
 */
export function MasterTablePage() {
  const { t, i18n } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const unitName = useUnitName()
  const { captureEvent } = useAnalyticsActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [controlsOpen, setControlsOpen] = useState(false)

  const events = useLegendaryEvents()
  const units = useLegendaryEventUnits()
  const roster = useLegendaryEventRoster()
  const progress = useLegendaryEventsProgress()
  const plans = useLegendaryEventPlans()
  const config = useClearEstimateConfig()

  const nameOf = useCallback(
    (unitId: string) => unitName("Character", unitId),
    [unitName]
  )
  const pickerEvents = useMemo((): MasterTablePickerEvent[] => {
    if (events.status !== "ready") return []
    const groups = orderLegendaryEventsForHub(
      events.data,
      events.nowMs,
      (event) => nameOf(event.id),
      i18n.language
    )
    return [
      ...groups.active.map(({ event }) => ({ id: event.id, archived: false })),
      ...groups.upcoming.map(({ event }) => ({
        id: event.id,
        archived: false,
      })),
      ...groups.archived.map(({ event }) => ({ id: event.id, archived: true })),
    ]
  }, [events, nameOf, i18n.language])

  const rosterData = roster.status === "ready" ? roster.data : undefined
  const planData = plans.status === "ready" ? plans.data : undefined
  const unitSets: UnitSetAvailability = {
    unlocked:
      roster.status === "loading"
        ? "loading"
        : rosterData
          ? "ready"
          : "noRoster",
    inTeams:
      plans.status === "ready"
        ? "ready"
        : plans.status === "error"
          ? "failed"
          : "loading",
  }
  const query = parseMasterTableQuery(searchParams)
  const hasTeams = (eventIds: readonly string[]) =>
    (planData ?? []).some(
      (plan) => eventIds.includes(plan.eventId) && plan.teams.length > 0
    )
  // The selection does not depend on Estimated, so it is resolved first to know which events'
  // battles Estimated needs.
  const selection = resolveMasterTableState({
    query,
    pickerEvents,
    hasTeams,
    unitSets,
    estimated: "ready",
  }).selectedEventIds
  const battles = useLegendaryEventsBattles(selection)
  const eventsData = events.status === "ready" ? events.data : undefined
  const selectionKey = selection.join(",")
  const selectedEvents = useMemo(
    () =>
      selectionKey
        .split(",")
        .flatMap((id) => eventsData?.filter((event) => event.id === id) ?? []),
    [eventsData, selectionKey]
  )
  const estimated = estimatedAvailability({
    config,
    battles: battles.status === "ready" ? battles.data : battles.status,
    roster: unitSets.unlocked,
    events: selectedEvents,
  })
  const state = resolveMasterTableState({
    query,
    pickerEvents,
    hasTeams,
    unitSets,
    estimated,
  })

  const unitsData = units.status === "ready" ? units.data : undefined
  const progressData = progress.status === "ready" ? progress.data : undefined
  const battlesData = battles.status === "ready" ? battles.data : undefined
  const estimateConfig = config.status === "ready" ? config.config : undefined
  const table = useMemo(
    () =>
      unitsData
        ? buildMasterTable({
            events: masterTableEventInputs({
              events: selectedEvents,
              plans: planData,
              progress: progressData,
              battles: battlesData,
            }),
            units: unitsData,
            roster: rosterData,
            config: estimateConfig,
            unitSet: state.unitSet,
            pointsMode: state.points,
          })
        : undefined,
    [
      unitsData,
      selectedEvents,
      planData,
      progressData,
      battlesData,
      rosterData,
      estimateConfig,
      state.unitSet,
      state.points,
    ]
  )
  const rows = table
    ? sortMasterTable(
        filterMasterTableRows(table.rows, state.q, nameOf, i18n.language),
        state.sort,
        nameOf,
        i18n.language
      )
    : []

  // Recorded once every read the effective unit set and points mode depend on has settled, so
  // the event carries what the user actually sees rather than a transient fallback.
  const settled = masterTableViewSettled({
    events: events.status,
    units: units.status,
    plans: plans.status,
    roster: roster.status,
    config: config.status,
    battles: battles.status,
    state,
  })
  const viewed = useRef(false)
  const eventCount = state.selectedEventIds.length
  useEffect(() => {
    if (!settled || viewed.current) return
    viewed.current = true
    captureEvent({
      type: "legendary_event_master_table_viewed",
      eventCount,
      unitSet: state.unitSet,
      pointsMode: state.points,
    })
  }, [settled, captureEvent, eventCount, state.unitSet, state.points])
  useTourPageSteps(useMasterTableTutorial(setControlsOpen))

  const update = (
    changes: Parameters<typeof nextMasterTableParams>[1],
    replace = false
  ) =>
    setSearchParams(nextMasterTableParams(searchParams, changes), { replace })
  const changed = (
    control: "events" | "unitSet" | "pointsMode" | "sort",
    value: string | null,
    eventCount: number | null = null
  ) =>
    captureEvent({
      type: "legendary_event_master_table_changed",
      control,
      value,
      eventCount,
    })
  const controls = {
    state,
    pickerEvents,
    eventName: nameOf,
    unitSets,
    estimated,
    onEventsChange: (eventIds: string[]) => {
      if (eventIds.join(",") === state.selectedEventIds.join(",")) return
      update({
        events: eventIds.join(","),
        sort: state.sort && eventIds.includes(state.sort) ? state.sort : null,
      })
      changed("events", null, eventIds.length)
    },
    onUnitSetChange: (unitSet: MasterTableUnitSet) => {
      if (unitSet === state.unitSet) return
      update({ units: unitSet })
      changed("unitSet", unitSet)
    },
    onPointsChange: (points: MasterTablePointsMode) => {
      if (points === state.points) return
      update({ points })
      changed("pointsMode", points)
    },
    onSortChange: (eventId: string | null) => {
      if (eventId === state.sort) return
      update({ sort: eventId })
      changed("sort", eventId ?? "total")
    },
    onQueryChange: (q: string) => update({ q }, true),
  }

  if (events.status === "loading" || units.status === "loading") {
    return (
      <div className="flex flex-col gap-3" data-testid="master-table-loading">
        <span className="sr-only">{t("masterTable.loading")}</span>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }
  if (events.status === "error" || units.status === "error") {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="master-table-error"
      >
        <p className="text-sm text-destructive">{t("masterTable.error")}</p>
        <Button
          onClick={() => {
            events.retry()
            units.retry()
          }}
          variant="outline"
        >
          {t("hub.retry")}
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-testid="master-table-page"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t("masterTable.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("masterTable.subtitle")}
        </p>
      </header>
      <MasterTableControls
        {...controls}
        controlsOpen={controlsOpen}
        isMobile={isMobile}
        onControlsOpenChange={setControlsOpen}
      />
      <MasterTableNotes
        estimatedFallback={state.estimatedFallback}
        progressFailed={progress.status === "error" && state.points !== "all"}
      />
      <PointsExplanation />
      {state.selectedEventIds.length === 0 ? (
        <p
          className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
          data-testid="master-table-no-events"
        >
          {t("masterTable.noEvents")}
        </p>
      ) : state.pending ? (
        <div
          className="flex flex-col gap-2"
          data-testid="master-table-rows-loading"
        >
          <span className="sr-only">
            {state.points === "estimated" && estimated === "loading"
              ? t("masterTable.points.estimatesLoading")
              : t("masterTable.rowsLoading")}
          </span>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <div
          className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4"
          data-testid="master-table-no-rows"
        >
          <p className="text-sm text-muted-foreground">
            {t("masterTable.noRows")}
          </p>
          {state.q ? (
            <Button
              onClick={() => update({ q: null }, true)}
              size="sm"
              variant="outline"
            >
              {t("masterTable.search.clear")}
            </Button>
          ) : null}
        </div>
      ) : isMobile ? (
        <MasterTableList
          eventIds={state.selectedEventIds}
          eventName={nameOf}
          rows={rows}
          unitName={nameOf}
          unitSet={state.unitSet}
        />
      ) : (
        <MasterTableTable
          eventIds={state.selectedEventIds}
          eventName={nameOf}
          onSortChange={controls.onSortChange}
          rows={rows}
          sort={state.sort}
          unitName={nameOf}
          unitSet={state.unitSet}
        />
      )}
    </div>
  )
}

function MasterTableNotes({
  estimatedFallback,
  progressFailed,
}: {
  estimatedFallback: MasterTableState["estimatedFallback"]
  progressFailed: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  if (!estimatedFallback && !progressFailed) return null
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      {estimatedFallback ? (
        <p data-testid="master-table-estimated-fallback">
          {estimatedFallback === "noRoster"
            ? t("masterTable.points.estimatedFallbackNoRoster")
            : t("masterTable.points.estimatedFallback")}
        </p>
      ) : null}
      {progressFailed ? (
        <p data-testid="master-table-no-progress">
          {t("masterTable.points.noProgress")}
        </p>
      ) : null}
    </div>
  )
}

/** "How points work": one line per points mode and the In teams rule. */
function PointsExplanation() {
  const { t } = useTranslation("legendaryEvents")
  return (
    <details
      className="rounded-xl border px-3 py-2 text-sm"
      data-testid="master-table-explanation"
    >
      <summary className="cursor-pointer font-medium">
        {t("masterTable.explanation.title")}
      </summary>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
        <li>{t("masterTable.explanation.remaining")}</li>
        <li>{t("masterTable.explanation.all")}</li>
        <li>{t("masterTable.explanation.estimated")}</li>
        <li>{t("masterTable.explanation.inTeams")}</li>
      </ul>
    </details>
  )
}
