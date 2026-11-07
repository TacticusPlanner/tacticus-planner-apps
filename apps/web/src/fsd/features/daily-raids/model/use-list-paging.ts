import { useState } from "react"

/** Rows a long raid list shows before "Show next" (Dailies > HSE farm list, HRE raids). */
const LIST_FIRST_SHOWN = 10
/** Rows each "Show next" adds. */
const LIST_SHOW_STEP = 5

/** How many rows show after one more "Show next" press, never past `total`. */
function nextShownCount(shown: number, total: number): number {
  return Math.min(total, shown + LIST_SHOW_STEP)
}

/**
 * The first `LIST_FIRST_SHOWN` of `items`, growing by `LIST_SHOW_STEP` on `showNext` or to all on
 * `showAll`. A new `items` array (another project, filter or order) starts over at the first rows.
 */
export function useListPaging<Item>(items: readonly Item[]) {
  const [shown, setShown] = useState(LIST_FIRST_SHOWN)
  const [source, setSource] = useState(items)
  if (source !== items) {
    setSource(items)
    setShown(LIST_FIRST_SHOWN)
  }
  return {
    visible: items.slice(0, shown),
    total: items.length,
    hidden: Math.max(0, items.length - shown),
    next: Math.max(0, nextShownCount(shown, items.length) - shown),
    showNext: () => setShown((count) => nextShownCount(count, items.length)),
    showAll: () => setShown(items.length),
  }
}

export type ListPaging = ReturnType<typeof useListPaging>
