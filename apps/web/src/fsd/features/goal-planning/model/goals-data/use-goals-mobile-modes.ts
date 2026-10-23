import { useState } from "react"

/** Mobile select mode beside the reorder mode (`goal-bulk-actions`): the two are mutually exclusive,
 *  and leaving select mode discards the selection. */
export function useGoalsMobileModes({
  clearSelection,
  exitReorder,
  reorderActive,
  toggleReorder,
}: {
  clearSelection: () => void
  exitReorder: () => void
  reorderActive: boolean
  toggleReorder: () => void
}) {
  const [selectActive, setSelectActive] = useState(false)
  const exitSelect = () => {
    setSelectActive(false)
    clearSelection()
  }
  return {
    selectActive,
    exitSelect,
    toggleSelect: () => {
      if (selectActive) return exitSelect()
      exitReorder()
      setSelectActive(true)
    },
    toggleReorderExclusive: () => {
      if (!reorderActive) exitSelect()
      toggleReorder()
    },
  }
}
