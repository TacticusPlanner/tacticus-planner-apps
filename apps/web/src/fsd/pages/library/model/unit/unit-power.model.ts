import type { ReadState } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"

/** A power figure as a page shows it: a placeholder while the `unit-power` dataset loads, nothing
 *  when it failed to load or has no entry for the unit, else the whole number. */
export type PowerFigure =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; value: number }

/** The figure for a power read: `compute` runs once the context is ready (null = unavailable). */
export function powerFigure(
  context: ReadState<UnitPowerContext | null>,
  compute: (context: UnitPowerContext) => number | null
): PowerFigure {
  if (context.status === "loading") return { status: "loading" }
  if (context.status === "error" || !context.data) {
    return { status: "unavailable" }
  }
  const value = compute(context.data)
  return value === null ? { status: "unavailable" } : { status: "ready", value }
}

/** The muted line under a figure: what it counts when ready. */
export function powerNote(
  figure: PowerFigure,
  note: string | undefined
): string | undefined {
  if (figure.status === "ready") return note
  return undefined
}
