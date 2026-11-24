import { useCallback, useState } from "react"

import type { GoalRow } from "../shared/types"

const EMPTY: ReadonlySet<string> = new Set()

/** Which visible goals the select-all menu picks. */
export type GoalSelectionPreset = "all" | "none" | "Active" | "Paused"

type SelectionState = {
  key: string
  ids: ReadonlySet<string>
  /** The goal last toggled on its own: where a shift-click range starts. */
  anchor: string | null
}

/** The ids from `anchor` to `target` inclusive, in visible order, either way round; just `target`
 *  when the anchor isn't visible. */
export function rangeOfIds(
  visibleIds: readonly string[],
  anchor: string | null,
  target: string
): string[] {
  const from = anchor === null ? -1 : visibleIds.indexOf(anchor)
  const to = visibleIds.indexOf(target)
  if (from === -1 || to === -1) return [target]
  return visibleIds.slice(Math.min(from, to), Math.max(from, to) + 1)
}

/**
 * The Goals page's row selection (`goal-bulk-actions`): page-local, never persisted. It is tied to
 * `scopeKey` — a string of everything the user controls about which rows show (status filter, type,
 * project scope, group, view) — so a change of any of them discards it without an effect: the stored
 * ids only count while their key matches the current one. `rows` is the flattened visible set across
 * groups, which is what select-all covers.
 */
export function useGoalsSelection(rows: readonly GoalRow[], scopeKey: string) {
  const [state, setState] = useState<SelectionState>({
    key: scopeKey,
    ids: EMPTY,
    anchor: null,
  })
  const selection = state.key === scopeKey ? state.ids : EMPTY
  const visibleIds = rows.map((row) => row.goalId)

  const update = (next: ReadonlySet<string>) =>
    setState({ key: scopeKey, ids: next, anchor: null })
  // Stable per scope (functional update), so memoized rows don't re-render on every selection change.
  const onToggleSelected = useCallback(
    (goalId: string) =>
      setState((prev) => {
        const next = new Set(prev.key === scopeKey ? prev.ids : EMPTY)
        if (!next.delete(goalId)) next.add(goalId)
        return { key: scopeKey, ids: next, anchor: goalId }
      }),
    [scopeKey]
  )
  const selectAllVisible = () =>
    update(
      visibleIds.every((id) => selection.has(id)) ? EMPTY : new Set(visibleIds)
    )
  /** Shift-click: selects every visible goal from the last one toggled through `goalId`. Stable while
   *  the scope and the visible goals stay the same, and reads the selection as it stands, so a memoized
   *  row's copy is never stale. */
  const visibleKey = visibleIds.join("|")
  const selectRange = useCallback(
    (goalId: string) =>
      setState((prev) => {
        const ids = visibleKey.split("|")
        const mine = prev.key === scopeKey ? prev : undefined
        const next = new Set(mine?.ids ?? EMPTY)
        for (const id of rangeOfIds(ids, mine?.anchor ?? null, goalId)) {
          next.add(id)
        }
        return { key: scopeKey, ids: next, anchor: goalId }
      }),
    [scopeKey, visibleKey]
  )
  /** The select-all menu: every visible goal, none, or the visible Active or Paused ones. */
  const selectPreset = (preset: GoalSelectionPreset) =>
    update(
      preset === "none"
        ? EMPTY
        : new Set(
            rows
              .filter((row) => preset === "all" || row.status === preset)
              .map((row) => row.goalId)
          )
    )

  return {
    selection,
    selectedRows: rows.filter((row) => selection.has(row.goalId)),
    visibleIds,
    onToggleSelected,
    selectAllVisible,
    selectRange,
    selectPreset,
    clearSelection: () => update(EMPTY),
  }
}
