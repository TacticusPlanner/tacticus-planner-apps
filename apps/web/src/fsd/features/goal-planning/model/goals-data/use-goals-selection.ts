import { useCallback, useState } from "react"

import type { GoalRow } from "../shared/types"

const EMPTY: ReadonlySet<string> = new Set()

/**
 * The Goals page's row selection (`goal-bulk-actions`): page-local, never persisted. It is tied to
 * `scopeKey` — a string of everything the user controls about which rows show (status filter, type,
 * project scope, group) — so a change of any of them discards it without an effect: the stored ids
 * only count while their key matches the current one. `rows` is the flattened visible set across
 * groups, which is what select-all covers.
 */
export function useGoalsSelection(rows: readonly GoalRow[], scopeKey: string) {
  const [state, setState] = useState({ key: scopeKey, ids: EMPTY })
  const selection = state.key === scopeKey ? state.ids : EMPTY
  const visibleIds = rows.map((row) => row.goalId)

  const update = (next: ReadonlySet<string>) =>
    setState({ key: scopeKey, ids: next })
  // Stable per scope (functional update), so memoized rows don't re-render on every selection change.
  const onToggleSelected = useCallback(
    (goalId: string) =>
      setState((prev) => {
        const next = new Set(prev.key === scopeKey ? prev.ids : EMPTY)
        if (!next.delete(goalId)) next.add(goalId)
        return { key: scopeKey, ids: next }
      }),
    [scopeKey]
  )
  const selectAllVisible = () =>
    update(
      visibleIds.every((id) => selection.has(id)) ? EMPTY : new Set(visibleIds)
    )

  return {
    selection,
    selectedRows: rows.filter((row) => selection.has(row.goalId)),
    visibleIds,
    onToggleSelected,
    selectAllVisible,
    clearSelection: () => update(EMPTY),
  }
}
