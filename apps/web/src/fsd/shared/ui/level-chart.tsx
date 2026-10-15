import { useId, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

import {
  chartScale,
  chartY,
  formatCompact,
  formatPoint,
  type ChartPoint,
} from "./level-chart.model"

const PLOT_WIDTH = 1000

/**
 * A one-series chart over an ordered x axis (ability level, relic level, rank): a line, or a band
 * for `[min, max]` points. Plain SVG with HTML labels. The plot is hidden from assistive technology;
 * `caption` summarises it, and the controls next to the chart carry the exact values.
 *
 * The header shows `<x label>: <value>` for the marker, or for the hovered column while hovering.
 * With `onSelect`, clicking a column reports its index (an ability chart sets its level that way).
 * With `dimFrom`, the columns from that index on are faded and their readout gets `dimmedSuffix`.
 */
export function LevelChart({
  title,
  points,
  xLabels,
  xTicks,
  tickLabel,
  markerIndex,
  caption,
  onSelect,
  readoutSuffix,
  dimFrom,
  dimmedSuffix,
  fromZero = true,
  height = 150,
  locale,
  className,
  "data-testid": testId,
}: {
  title: string
  points: readonly ChartPoint[]
  /** One label per point, used by the readout. */
  xLabels: readonly string[]
  /** Indexes of `xLabels` shown under the axis. */
  xTicks: readonly number[]
  /** A shorter label for an axis tick, when the readout's label is too long to sit under the axis. */
  tickLabel?: (index: number) => string
  markerIndex?: number
  caption: string
  onSelect?: (index: number) => void
  /** Appended to the marker's readout, e.g. " (yours)". */
  readoutSuffix?: string
  /** The first column to fade, e.g. the first rank a unit's stars can't reach. */
  dimFrom?: number
  /** Appended to the readout of a faded column. */
  dimmedSuffix?: string
  fromZero?: boolean
  height?: number
  locale?: string
  className?: string
  "data-testid"?: string
}) {
  const captionId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | undefined>()
  const scale = chartScale(points, fromZero)
  const count = points.length
  const columnWidth = count > 0 ? PLOT_WIDTH / count : PLOT_WIDTH
  const x = (index: number) => (index + 0.5) * columnWidth
  const y = (value: number) => height - chartY(value, scale) * height
  const isBand = points.some((point) => point.length > 1)

  const linePath = (pick: (point: ChartPoint) => number) =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${x(index)},${y(pick(point))}`
      )
      .join(" ")
  const lower = (point: ChartPoint) => point[0]
  const upper = (point: ChartPoint) => point.at(-1)!
  const bandPath = isBand
    ? `${linePath(upper)} ${points
        .map((point, index) => ({ point, index }))
        .reverse()
        .map(({ point, index }) => `L${x(index)},${y(lower(point))}`)
        .join(" ")} Z`
    : undefined

  const readoutIndex = hoverIndex ?? markerIndex
  const dimmed = dimFrom !== undefined && dimFrom < count ? dimFrom : undefined
  const readout =
    readoutIndex !== undefined && points[readoutIndex]
      ? `${xLabels[readoutIndex]}: ${formatPoint(points[readoutIndex], locale)}${
          hoverIndex === undefined || hoverIndex === markerIndex
            ? (readoutSuffix ?? "")
            : ""
        }${
          dimmed !== undefined && readoutIndex >= dimmed
            ? (dimmedSuffix ?? "")
            : ""
        }`
      : ""

  return (
    <figure
      className={cn("flex flex-col gap-1", className)}
      aria-labelledby={captionId}
      data-testid={testId}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="text-muted-foreground">{title}</span>
        <span
          className="font-semibold tabular-nums"
          data-testid={testId && `${testId}-readout`}
        >
          {readout}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        <div
          className="relative w-11 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
          style={{ height }}
        >
          {[scale.max, scale.mid, scale.min].map((tick, index) => (
            <span
              key={index}
              className="absolute right-1 -translate-y-1/2"
              style={{ top: `${(1 - chartY(tick, scale)) * 100}%` }}
            >
              {formatCompact(tick, locale)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${PLOT_WIDTH} ${height}`}
            preserveAspectRatio="none"
            className="block w-full overflow-visible"
            style={{ height }}
            onMouseLeave={() => setHoverIndex(undefined)}
          >
            {[scale.max, scale.mid, scale.min].map((tick, index) => (
              <line
                key={index}
                x1={0}
                x2={PLOT_WIDTH}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {bandPath && (
              <path
                d={bandPath}
                fill="var(--chart-1)"
                fillOpacity={0.18}
                stroke="none"
              />
            )}
            <path
              d={linePath(upper)}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {isBand && (
              <path
                d={linePath(lower)}
                fill="none"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {dimmed !== undefined && (
              <rect
                x={dimmed * columnWidth}
                y={0}
                width={(count - dimmed) * columnWidth}
                height={height}
                fill="var(--card)"
                fillOpacity={0.7}
                data-testid={testId && `${testId}-dimmed`}
                data-from={dimmed}
              />
            )}
            {markerIndex !== undefined && points[markerIndex] && (
              <line
                x1={x(markerIndex)}
                x2={x(markerIndex)}
                y1={0}
                y2={height}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                data-testid={testId && `${testId}-marker`}
                data-index={markerIndex}
              />
            )}
            {hoverIndex !== undefined && (
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={0}
                y2={height}
                stroke="var(--foreground)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {points.map((_, index) => (
              <rect
                key={index}
                x={index * columnWidth}
                y={0}
                width={columnWidth}
                height={height}
                fill="transparent"
                className={onSelect ? "cursor-pointer" : undefined}
                onMouseEnter={() => setHoverIndex(index)}
                onClick={onSelect ? () => onSelect(index) : undefined}
                data-testid={testId && `${testId}-column-${index}`}
              />
            ))}
          </svg>
          {markerIndex !== undefined && points[markerIndex] && (
            <div className="relative h-0">
              <span
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-[var(--chart-1)]"
                style={{
                  left: `${((markerIndex + 0.5) / count) * 100}%`,
                  top: -height * chartY(upper(points[markerIndex]), scale),
                }}
              />
            </div>
          )}
          <div className="relative mt-1 h-4 text-xs text-muted-foreground">
            {xTicks.map((index) => (
              <span
                key={index}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${((index + 0.5) / count) * 100}%` }}
              >
                {tickLabel ? tickLabel(index) : xLabels[index]}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption id={captionId} className="sr-only">
        {caption}
      </figcaption>
    </figure>
  )
}
