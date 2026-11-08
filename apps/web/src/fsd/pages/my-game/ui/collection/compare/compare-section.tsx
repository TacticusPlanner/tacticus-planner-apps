import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, ClockPlus, History } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { RosterDiffMetric } from "@/entities/roster-snapshot"
import type { UnitTileUnit } from "@/entities/unit"
import { useAnalyticsActions } from "@/shared/analytics"

import { compareFocus } from "../../../model/compare-chips"
import { sourceLabel } from "../../../model/compare-labels"
import { useSourceLabels } from "../../../model/use-source-labels"
import { COMPARE_CURRENT } from "../../../model/compare-query"
import { buildCompareView } from "../../../model/compare-view"
import type { CollectionCompareState } from "../../../model/use-collection-compare"
import { useCompareFields } from "../../../model/use-compare-fields"
import type { CompareQueryState } from "../../../model/use-compare-query"
import { CompareControls } from "./compare-bar"
import { CompareList } from "./compare-list"
import { CompareSummary } from "./compare-summary"

/**
 * Compare mode's body in place of the faction cards (spec: collection-snapshot-compare): its
 * loading, error and empty states, then the options, the summary and the changed units.
 */
export function CompareSection({
  state,
  compare,
  units,
  filtered,
  onTake,
}: {
  state: Exclude<CollectionCompareState, { mode: "off" | "guest" }>
  compare: CompareQueryState
  /** The Collection view's listed units at the "to" state. */
  units: readonly UnitTileUnit[]
  /** A search, filter or quick filter narrows the units. */
  filtered: boolean
  onTake: () => void
}) {
  const { t } = useTranslation("common")

  if (state.mode === "loading") {
    return (
      <div className="flex flex-col gap-3" data-testid="compare-loading">
        <p className="sr-only" role="status">
          {t("myGame.collection.compare.loading")}
        </p>
        <Skeleton className="h-28 w-full rounded-[10px] motion-reduce:animate-none" />
        <Skeleton className="h-64 w-full rounded-[10px] motion-reduce:animate-none" />
      </div>
    )
  }
  if (state.mode === "error") {
    return (
      <Alert variant="destructive" data-testid="compare-error">
        <AlertTriangle />
        <AlertTitle>{t("myGame.collection.compare.errorTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("myGame.collection.compare.errorBody")}</p>
          <Button variant="outline" size="sm" onClick={state.retry}>
            {t("myGame.collection.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (state.mode === "empty") {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed px-4 py-10 text-center"
        data-testid="compare-empty"
      >
        <History aria-hidden className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-semibold">
            {t("myGame.collection.compare.emptyTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("myGame.collection.compare.emptyBody")}
          </p>
        </div>
        <Button size="sm" onClick={onTake}>
          <ClockPlus aria-hidden />
          {t("myGame.collection.snapshots.take")}
        </Button>
      </div>
    )
  }
  return (
    <ReadyCompare
      state={state}
      compare={compare}
      units={units}
      filtered={filtered}
    />
  )
}

function ReadyCompare({
  state,
  compare,
  units,
  filtered,
}: {
  state: Extract<CollectionCompareState, { mode: "ready" }>
  compare: CompareQueryState
  units: readonly UnitTileUnit[]
  filtered: boolean
}) {
  const { t, i18n } = useTranslation("common")
  const labels = useSourceLabels()
  const { captureEvent } = useAnalyticsActions()
  const [metric, setMetric] = useState<RosterDiffMetric | null>(null)
  const [showUnchanged, setShowUnchanged] = useState(false)
  const [fields, setFields] = useCompareFields()
  const { query, update } = compare
  const { from, to } = state

  const view = useMemo(
    () =>
      buildCompareView(units, state.diffs, {
        metric,
        teamUnitIds: state.teamUnitIds,
        order: query.order,
        locale: i18n.language,
      }),
    [units, state.diffs, state.teamUnitIds, metric, query.order, i18n.language]
  )

  const fromId = from.id
  const toKind = to?.kind ?? "current"
  useEffect(() => {
    captureEvent({ type: "roster_compare_opened", fromKind: from.kind, toKind })
    // One event per pair of sources compared; captureEvent changes once, when the client loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId, to?.id, captureEvent])

  const label = (source: typeof from) =>
    sourceLabel(source, i18n.language, labels)
  const events = useMemo(
    () =>
      state.sources.plans.map((plan) => ({
        id: plan.eventId,
        name: state.sources.eventNames.get(plan.eventId) ?? plan.eventId,
      })),
    [state.sources]
  )

  return (
    <div className="flex flex-col gap-4" data-testid="compare-section">
      <CompareControls
        query={query}
        update={update}
        sources={state.sources.sources}
        fromId={from.id}
        toId={to?.id ?? COMPARE_CURRENT}
        events={events}
        fields={fields}
        onFieldsChange={setFields}
        showUnchanged={showUnchanged}
        onShowUnchangedChange={setShowUnchanged}
      />
      <CompareSummary
        title={t("myGame.collection.compare.summaryTitle", {
          from: label(from),
          to: to ? label(to) : t("myGame.collection.compare.current"),
        })}
        summary={view.summary}
        matching={view.matching}
        filtered={filtered || state.teamUnitIds !== null}
        selected={metric}
        onSelect={(next) => {
          setMetric(next)
          if (next) {
            captureEvent({
              type: "roster_compare_metric_selected",
              metric: next,
            })
          }
        }}
      />
      {view.changed.length === 0 && !showUnchanged ? (
        <p
          className="rounded-[10px] border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          role="status"
          data-testid="compare-no-changes"
        >
          {t("myGame.collection.compare.noChanges")}
        </p>
      ) : (
        <CompareList
          changed={view.changed}
          unchanged={view.unchanged}
          showUnchanged={showUnchanged}
          fields={fields}
          focus={compareFocus(metric, query.order)}
        />
      )}
    </div>
  )
}
