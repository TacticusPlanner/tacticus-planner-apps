/** One x position: a single value, or `[min, max]` for a range drawn as a band. */
export type ChartPoint = readonly number[]

export type ChartScale = { min: number; mid: number; max: number }

/** The smallest of 1, 2, 2.5, 5 × 10^n that is at least `value`. */
export function niceStep(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const factor =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10
  return factor * magnitude
}

/**
 * Three y ticks. From zero: `0`, a nice max at or above the data, and its midpoint. Not from zero:
 * the data's range snapped outward to a nice step, so a change across levels stays visible (V1's
 * zero-based relic axis looked flat).
 */
export function chartScale(
  points: readonly ChartPoint[],
  fromZero: boolean
): ChartScale {
  const values = points.flat()
  const dataMax = values.length > 0 ? Math.max(...values) : 0
  const dataMin = values.length > 0 ? Math.min(...values) : 0

  if (fromZero || dataMin === dataMax) {
    const step = niceStep(Math.max(dataMax, 0) / 2)
    const max = step * 2
    return { min: 0, mid: max / 2, max }
  }
  const step = niceStep((dataMax - dataMin) / 2)
  const min = Math.floor(dataMin / step) * step
  const max = Math.max(Math.ceil(dataMax / step) * step, min + step * 2)
  return { min, mid: (min + max) / 2, max }
}

/** 0 at the bottom of the plot, 1 at the top. */
export function chartY(value: number, scale: ChartScale): number {
  if (scale.max === scale.min) return 0
  return (value - scale.min) / (scale.max - scale.min)
}

export function formatCompact(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPoint(point: ChartPoint, locale?: string): string {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  return point.map((value) => format.format(value)).join("–")
}

/** First and last value of a series, formatted, for its text summary. */
export function describeSeries(
  points: readonly ChartPoint[],
  locale?: string
): { from: string; to: string } {
  const first = points[0]
  const last = points.at(-1)
  return {
    from: first ? formatPoint(first, locale) : "",
    to: last ? formatPoint(last, locale) : "",
  }
}
