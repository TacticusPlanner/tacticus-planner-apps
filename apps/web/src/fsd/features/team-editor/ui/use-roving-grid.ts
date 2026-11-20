import { useCallback, useState } from "react"
import type { KeyboardEvent } from "react"

const ITEM_SELECTOR = "[data-roving-item]:not(:disabled)"

/** The number of columns a CSS grid currently lays out. */
function columnCount(grid: HTMLElement) {
  const template = getComputedStyle(grid).gridTemplateColumns
  const columns = template.split(" ").filter(Boolean).length
  return Math.max(columns, 1)
}

/**
 * One Tab stop for a grid of buttons (roving tabindex): Tab enters and leaves the grid, the arrow
 * keys move between items by row and column, and Home and End go to the first and last item.
 * Disabled items are skipped. Mark the grid with `data-roving-grid` and each item with
 * `data-roving-item`, and give each item `tabIndex` from `tabIndexFor`, `onFocus` from
 * `onItemFocus` and `onKeyDown` from `onItemKeyDown`.
 */
export function useRovingGrid(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  // The remembered item may have been filtered out: the grid's first item then takes the stop.
  const current =
    activeId !== null && ids.includes(activeId) ? activeId : ids[0]

  const tabIndexFor = (id: string) => (id === current ? 0 : -1)

  const onItemFocus = useCallback((id: string) => setActiveId(id), [])

  const onItemKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const grid = event.currentTarget.closest<HTMLElement>("[data-roving-grid]")
    if (!grid) return
    const items = [...grid.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]
    const index = items.indexOf(event.currentTarget)
    if (index === -1) return
    const columns = columnCount(grid)
    const target = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + columns,
      ArrowUp: index - columns,
      Home: 0,
      End: items.length - 1,
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    items[Math.min(Math.max(target, 0), items.length - 1)]?.focus()
  }, [])

  return { tabIndexFor, onItemFocus, onItemKeyDown }
}
