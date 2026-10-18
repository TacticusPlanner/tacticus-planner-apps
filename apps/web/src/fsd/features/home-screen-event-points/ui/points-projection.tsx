import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { formatRelativeTime } from "@/shared/lib"

import type { HseProjectionMode } from "../lib/hse-projection"
import type { HseTokenMode } from "../lib/hse-token-supply"
import type {
  HseEventPointsState,
  HseProjectionView,
} from "../model/hse-event-points"

type ReadyProjection = Extract<HseProjectionView, { status: "ready" }>

/** An input's text as an average: empty clears it (null), anything else a non-negative number. */
function parseAverage(raw: string): number | null {
  if (raw.trim() === "") return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.max(0, value) : null
}

/**
 * The points projection of a running or upcoming personal event: the final milestone, points so far
 * (running only) and what remains, the units to defeat, the average needed per token, and the points
 * the player's own averages project. Desktop lays the modes out as a table; mobile stacks one row per
 * mode under the totals.
 */
export function PointsProjection({
  state,
  hasRaidLists,
  className,
}: {
  state: HseEventPointsState
  /** True when the farm list is shown below (the campaign-raid hint points to it). */
  hasRaidLists: boolean
  className?: string
}) {
  const { t } = useTranslation("dailies")
  const frame = (children: ReactNode) => (
    <section
      className={cn("space-y-3 rounded-xl border p-4", className)}
      data-testid="hse-projection"
    >
      <h2 className="font-semibold">{t("hse.projection.title")}</h2>
      {children}
    </section>
  )

  if (state.status === "loading" && state.projectionPending)
    return frame(
      <div
        aria-label={t("hse.projection.loading")}
        className="flex min-h-12 items-center"
        data-testid="hse-projection-loading"
      >
        <Spinner className="size-5" />
      </div>
    )
  if (state.status !== "ready") return null
  const view = state.projection
  if (view.status === "hidden") return null
  if (view.status === "error")
    return frame(
      <Alert data-testid="hse-projection-error" variant="destructive">
        <AlertDescription>{t("hse.projection.error")}</AlertDescription>
      </Alert>
    )
  return frame(<ReadyProjectionBody hasRaidLists={hasRaidLists} view={view} />)
}

function useModeName() {
  const { t } = useTranslation("dailies")
  return (mode: HseTokenMode) => t(`hse.details.modes.${mode}`)
}

function ReadyProjectionBody({
  view,
  hasRaidLists,
}: {
  view: ReadyProjection
  hasRaidLists: boolean
}) {
  const { t, i18n } = useTranslation("dailies")
  const isMobile = useIsMobile()
  const modeName = useModeName()
  const { projection, inputs } = view
  const numbers = new Intl.NumberFormat(i18n.language)
  const listFormat = new Intl.ListFormat(i18n.language, { type: "conjunction" })
  const lockedList = listFormat.format(projection.lockedModes.map(modeName))

  if (projection.modes.length === 0)
    return (
      <p className="text-sm" data-testid="hse-projection-all-locked">
        {t("hse.projection.allLocked", { modes: lockedList })}
      </p>
    )

  const pts = (value: number) =>
    t("hse.projection.points", { value: numbers.format(value) })
  const required = projection.requiredPerToken
  const projected = projection.projected

  const totals = (
    <dl
      className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm"
      data-testid="hse-projection-totals"
    >
      <Total label={t("hse.projection.target")} testId="target">
        {pts(projection.target)}
      </Total>
      {view.instanceStatus === "running" ? (
        <Total label={t("hse.projection.pointsSoFar")} testId="points-so-far">
          <Input
            aria-describedby="hse-points-so-far-hint"
            aria-label={t("hse.projection.pointsSoFar")}
            className="h-7 w-28"
            data-testid="hse-projection-points-so-far-input"
            inputMode="numeric"
            min={0}
            onChange={(event) =>
              inputs.setPointsSoFar(parseAverage(event.target.value) ?? 0)
            }
            type="number"
            value={inputs.pointsSoFar}
          />
          <span
            className="mt-0.5 block text-xs text-muted-foreground"
            id="hse-points-so-far-hint"
          >
            {t("hse.projection.pointsSoFarHint")}
          </span>
        </Total>
      ) : null}
      <Total label={t("hse.projection.remaining")} testId="remaining">
        {projection.finalReached
          ? `${t("hse.projection.finalReached")} · ${t(
              "hse.projection.repeatsSoFar",
              { count: projection.repeatsSoFar }
            )}`
          : pts(projection.remaining)}
      </Total>
      {projection.unitsToFinal !== null && projection.modes[0] ? (
        <Total label={t("hse.projection.unitsToFinal")} testId="units">
          {projection.modes[0].unit === "waves"
            ? t("hse.projection.units.waves", {
                count: projection.unitsToFinal,
              })
            : t("hse.projection.units.kills", {
                count: projection.unitsToFinal,
              })}
        </Total>
      ) : null}
      {required ? (
        <Total label={t("hse.projection.required")} testId="required">
          {t(`hse.projection.perToken.${required.unit}`, {
            value: numbers.format(required.value),
          })}
        </Total>
      ) : null}
      <Total label={t("hse.projection.projected")} testId="projected">
        {projected ? (
          <>
            <span className="font-semibold">
              {t("hse.projection.projectedValue", {
                points: numbers.format(projected.points),
              })}
            </span>
            <span className="block text-muted-foreground">
              {projected.lastReachedPoints === null
                ? t("hse.projection.milestonesNone", {
                    total: projected.milestoneCount,
                  })
                : t("hse.projection.milestonesReached", {
                    reached: projected.milestonesReached,
                    total: projected.milestoneCount,
                    points: numbers.format(projected.lastReachedPoints),
                  })}
            </span>
            {projected.repeats > 0 ? (
              <span className="block text-muted-foreground">
                {t("hse.projection.repeats", { count: projected.repeats })}
              </span>
            ) : null}
            {projected.pointsToNext !== null ? (
              <span className="block text-muted-foreground">
                {projected.milestonesReached < projected.milestoneCount
                  ? t("hse.projection.toNext", {
                      points: numbers.format(projected.pointsToNext),
                    })
                  : t("hse.projection.toNextRepeat", {
                      points: numbers.format(projected.pointsToNext),
                    })}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground">
            {t("hse.projection.needAverage")}
          </span>
        )}
      </Total>
    </dl>
  )

  const notes: { id: string; text: string }[] = [
    ...projection.modes
      .filter((mode) => mode.trackerCount > 1)
      .map((mode) => ({
        id: `summed-${mode.mode}`,
        text: t("hse.projection.notes.summed", {
          mode: modeName(mode.mode),
          count: mode.trackerCount,
          perUnit: t(`hse.projection.perUnit.${mode.unit}`, {
            count: mode.pointsPerUnit,
          }),
        }),
      })),
    ...(projection.lockedModes.length > 0
      ? [
          {
            id: "locked",
            text: t("hse.projection.notes.locked", { modes: lockedList }),
          },
        ]
      : []),
    ...(view.enemyRestricted
      ? [{ id: "enemy", text: t("hse.projection.notes.enemyRestricted") }]
      : []),
    ...(projection.modes.some((mode) => mode.fixedAverage)
      ? [{ id: "battles", text: t("hse.projection.notes.battles") }]
      : []),
    ...(view.scoresInCampaign && hasRaidLists
      ? [{ id: "campaign", text: t("hse.projection.notes.campaign") }]
      : []),
    view.instanceStatus === "running"
      ? {
          id: "sync",
          text: t("hse.projection.notes.syncedAt", {
            when: formatRelativeTime(view.observedAtMs, i18n.language) ?? "",
          }),
        }
      : { id: "sync", text: t("hse.projection.notes.upcoming") },
  ]

  return (
    <>
      {totals}
      {isMobile ? (
        <ul className="space-y-2" data-testid="hse-projection-rows">
          {projection.modes.map((mode) => (
            <li
              className="space-y-1.5 rounded-lg border p-3"
              data-testid={`hse-projection-mode-${mode.mode}`}
              key={mode.mode}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{modeName(mode.mode)}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t("hse.projection.tokensValue", { count: mode.tokens })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <AverageInput mode={mode} onChange={inputs.setAverage} />
                <ModePoints mode={mode} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`hse.projection.perUnit.${mode.unit}`, {
                  count: mode.pointsPerUnit,
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <Table data-testid="hse-projection-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t("hse.projection.columns.mode")}</TableHead>
              <TableHead className="text-right">
                {t("hse.projection.columns.tokens")}
              </TableHead>
              <TableHead>{t("hse.projection.columns.average")}</TableHead>
              <TableHead className="text-right">
                {t("hse.projection.columns.perUnit")}
              </TableHead>
              <TableHead className="text-right">
                {t("hse.projection.columns.points")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projection.modes.map((mode) => (
              <TableRow
                data-testid={`hse-projection-mode-${mode.mode}`}
                key={mode.mode}
              >
                <TableCell className="font-medium">
                  {modeName(mode.mode)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numbers.format(mode.tokens)}
                </TableCell>
                <TableCell>
                  <AverageInput mode={mode} onChange={inputs.setAverage} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t(`hse.projection.perUnit.${mode.unit}`, {
                    count: mode.pointsPerUnit,
                  })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <ModePoints mode={mode} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ul
        className="space-y-1 text-xs text-muted-foreground"
        data-testid="hse-projection-notes"
      >
        {notes.map((note) => (
          <li data-testid={`hse-projection-note-${note.id}`} key={note.id}>
            {note.text}
          </li>
        ))}
      </ul>
    </>
  )
}

function Total({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: ReactNode
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums" data-testid={`hse-projection-${testId}`}>
        {children}
      </dd>
    </>
  )
}

function AverageInput({
  mode,
  onChange,
}: {
  mode: HseProjectionMode
  onChange: (mode: HseTokenMode, value: number | null) => void
}) {
  const { t } = useTranslation("dailies")
  const modeName = useModeName()
  if (mode.fixedAverage)
    return (
      <span data-testid={`hse-projection-average-${mode.mode}`}>
        {t("hse.projection.averageFixed")}
      </span>
    )
  return (
    <span className="flex items-center gap-1.5">
      <Input
        aria-label={t("hse.projection.averageLabel", {
          unit: t(`hse.projection.unit.${mode.unit}`),
          mode: modeName(mode.mode),
        })}
        aria-invalid={mode.average === null || undefined}
        className="h-7 w-20"
        data-testid={`hse-projection-average-${mode.mode}`}
        inputMode="decimal"
        min={0}
        onChange={(event) =>
          onChange(mode.mode, parseAverage(event.target.value))
        }
        placeholder={t("hse.projection.averageNeeded")}
        step="any"
        type="number"
        value={mode.average ?? ""}
      />
      <span className="text-xs text-muted-foreground">
        {t(`hse.projection.unit.${mode.unit}`)}
      </span>
    </span>
  )
}

function ModePoints({ mode }: { mode: HseProjectionMode }) {
  const { t, i18n } = useTranslation("dailies")
  const numbers = new Intl.NumberFormat(i18n.language)
  return (
    <span data-testid={`hse-projection-points-${mode.mode}`}>
      {mode.points === null
        ? "–"
        : t("hse.projection.points", {
            value: numbers.format(Math.floor(mode.points)),
          })}
    </span>
  )
}
