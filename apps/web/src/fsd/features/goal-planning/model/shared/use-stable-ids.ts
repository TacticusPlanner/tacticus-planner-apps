import { useMemo } from "react"

const separator = "\u0000"

/** `ids` with a reference that changes only when its contents do, so a caller can pass a freshly
 *  mapped id array every render and the goals hooks can still key their memos on it. */
export function useStableIds(ids: readonly string[]): readonly string[] {
  const key = ids.join(separator)
  return useMemo(() => (key ? key.split(separator) : []), [key])
}
