import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RadarAxisResult } from "../../model/stat-radar"

const RINGS = [0.25, 0.5, 0.75, 1]

/** The wiki's damage explanation: the "vs infinite armour" axes are its pierce-ratio minimum. */
const DAMAGE_WIKI_URL = "https://tacticus.wiki.gg/wiki/HDTW_Damage"

/** A point `fraction` of the way out on the axis at `index` (0 = top, clockwise, 60° apart). */
function point(
  index: number,
  fraction: number,
  radius: number,
  center: number
) {
  const angle = ((index * 60 - 90) * Math.PI) / 180
  return {
    x: center + Math.cos(angle) * radius * fraction,
    y: center + Math.sin(angle) * radius * fraction,
  }
}

function polygon(fractions: readonly number[], radius: number, center: number) {
  return fractions
    .map((fraction, index) => {
      const { x, y } = point(index, fraction, radius, center)
      return `${x},${y}`
    })
    .join(" ")
}

/**
 * V1's stat comparison: a six-axis radar of percentiles with the 50% outline, and the same values as
 * a list. The radar is decorative for assistive technology (its caption lists the values); the list
 * is the accessible equivalent.
 */
export function StatRadarCard({
  radar,
  unitName,
  size,
}: {
  radar: readonly RadarAxisResult[]
  unitName: string
  size: number
}) {
  const { t } = useTranslation("library")
  const center = size / 2
  // Room outside the rim for the labels.
  const radius = size * 0.32
  const rounded = radar.map((entry) => Math.round(entry.percentile))
  // A 0% vertex is drawn just off the centre so it stays visible.
  const shape = rounded.map((value) => Math.max(value / 100, 0.03))
  const armour = rounded[radar.findIndex((entry) => entry.axis === "armour")]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      {/* Side margin for the axis labels, which sit outside the rim. */}
      <figure className="m-0 shrink-0 px-9" data-testid="unit-radar">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          className="overflow-visible"
        >
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={polygon(
                [ring, ring, ring, ring, ring, ring],
                radius,
                center
              )}
              fill="none"
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
          ))}
          {radar.map((entry, index) => {
            const end = point(index, 1, radius, center)
            return (
              <line
                key={entry.axis}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
            )
          })}
          <polygon
            points={polygon([0.5, 0.5, 0.5, 0.5, 0.5, 0.5], radius, center)}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            data-testid="unit-radar-median"
          />
          <polygon
            points={polygon(shape, radius, center)}
            fill="var(--chart-1)"
            fillOpacity={0.22}
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {shape.map((fraction, index) => {
            const { x, y } = point(index, fraction, radius, center)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={4.5}
                fill="var(--chart-1)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            )
          })}
          {radar.map((entry, index) => {
            const { x, y } = point(index, 1.24, radius, center)
            const anchor =
              index === 0 || index === 3
                ? "middle"
                : index < 3
                  ? "start"
                  : "end"
            return (
              <text
                key={entry.axis}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs font-semibold"
              >
                {t(`characterUnit.compare.axesShort.${entry.axis}`)}
              </text>
            )
          })}
        </svg>
        <figcaption className="sr-only">
          {t("characterUnit.compare.caption", {
            values: radar
              .map(
                (entry, index) =>
                  `${t(`characterUnit.compare.axes.${entry.axis}`)} ${t("characterUnit.compare.percent", { value: rounded[index] })}`
              )
              .join(", "),
          })}
        </figcaption>
      </figure>

      <div className="flex min-w-[min(260px,100%)] flex-1 flex-col gap-2">
        <ul className="flex flex-col gap-2" data-testid="unit-radar-list">
          {radar.map((entry, index) => (
            <li
              key={entry.axis}
              className="grid grid-cols-[minmax(0,200px)_1fr_auto] items-center gap-3 text-sm"
              data-testid={`unit-radar-${entry.axis}`}
            >
              <span className="text-muted-foreground">
                {t(`characterUnit.compare.axes.${entry.axis}`)}
              </span>
              <span
                className="relative h-2 rounded-full bg-muted"
                aria-hidden="true"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--chart-1)]"
                  style={{ width: `${rounded[index]}%` }}
                />
                <span className="absolute inset-y-[-3px] left-1/2 border-l border-dashed border-muted-foreground" />
              </span>
              <span className="font-bold tabular-nums">
                {t("characterUnit.compare.percent", { value: rounded[index] })}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {t("characterUnit.compare.footnote", {
            value: armour,
            name: unitName,
          })}
        </p>
        <a
          href={DAMAGE_WIKI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary underline-offset-2 hover:underline"
          data-testid="unit-radar-damage-link"
        >
          {t("characterUnit.compare.damageLink")}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
