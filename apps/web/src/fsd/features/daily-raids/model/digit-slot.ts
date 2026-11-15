/** A figure space: as wide as a digit in tabular figures, and whitespace to text matching. */
const FIGURE_SPACE = " "

/**
 * A number padded to at least two digits' width with figure spaces, so short values in a list line
 * up with two-digit ones ("Battle 7" under "Battle 38", " 5/10" under "12/40"). `start` pads before
 * the value (a right-aligned number), `end` after it. Longer values ("12B") are left as they are.
 */
export function inDigitSlot(
  value: number | string,
  side: "start" | "end" = "start"
): string {
  const text = String(value)
  return side === "start"
    ? text.padStart(2, FIGURE_SPACE)
    : text.padEnd(2, FIGURE_SPACE)
}
