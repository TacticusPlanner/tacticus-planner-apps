import { useCallback, useState } from "react"

/** The id of a mounted cmdk `CommandList`, for the combobox trigger's `aria-controls`. cmdk assigns
 * the listbox its own `useId` and overrides any `id` prop, so the trigger reads it back through a
 * ref instead of generating one. `undefined` while the popup is closed (the list is unmounted). */
export function useCommandListId() {
  const [listId, setListId] = useState<string>()
  const listRef = useCallback(
    (element: HTMLElement | null) => setListId(element?.id || undefined),
    []
  )
  return [listId, listRef] as const
}
