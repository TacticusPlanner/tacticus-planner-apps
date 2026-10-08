/** Clamps a stepper value into `min..max` as an integer. */
function clampStepperValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * The value a typed stepper entry commits: `null` for an empty entry (only when the stepper can be
 * cleared), the clamped number for a numeric one, and `undefined` (keep the current value) for
 * anything else.
 */
export function parseStepperInput(
  text: string,
  min: number,
  max: number,
  clearable: boolean
): number | null | undefined {
  const trimmed = text.trim()
  if (trimmed === "") return clearable ? null : undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return undefined
  return clampStepperValue(parsed, min, max)
}

/** The value after a − or + press; from an empty stepper, + starts at `min`. */
export function stepStepperValue(
  value: number | null,
  delta: 1 | -1,
  min: number,
  max: number
): number {
  if (value === null) return min
  return clampStepperValue(value + delta, min, max)
}
