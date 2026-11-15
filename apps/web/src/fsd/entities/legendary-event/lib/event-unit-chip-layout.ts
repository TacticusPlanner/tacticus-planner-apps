/**
 * How a unit chip lays out its name. One rule per place, the same for every chip in it, so a column
 * or a team never mixes the two:
 * - `row` (design N1): one ~41px row, the name beside the portrait and rank with the ability levels
 *   under it.
 * - `stack` (design N4): the name on its own line across the top, then portrait, rank and levels.
 * - `auto`: a chip filling a board column is stacked, and every chip in the column turns into a row
 *   once the column is at least 8.5rem wide (a container query on the column's width, which
 *   follows the screen width and the number of shown lanes). 8.5rem is ~70px of fixed parts
 *   (border, padding, the 32px portrait, the 24px rank icon and their gaps) plus a ~66px name
 *   slot, so three lanes at 2560px (8.7rem columns) get rows. About one name in five ends in an
 *   ellipsis there (24 of 119; Healer and Mechanic chips also give room to their trait icon);
 *   the full name is in the details. The classes in `event-unit-chip.tsx` spell it out, as Tailwind needs.
 */
export type EventUnitChipLayout =
  { kind: "row" } | { kind: "stack" } | { kind: "auto" }

/**
 * The layout for a place:
 * - the Event board's unit table (chips filling a column) follows the column's width;
 * - chips sizing to their content (team cards, token cards) are always a row, as they grow to fit
 *   the name, up to their 10rem cap;
 * - a chip without its name (the team picker, whose tile names the unit) stacks.
 */
export function eventUnitChipLayout({
  fill,
  showName,
}: {
  fill: boolean
  showName: boolean
}): EventUnitChipLayout {
  if (!showName) return { kind: "stack" }
  return fill ? { kind: "auto" } : { kind: "row" }
}
