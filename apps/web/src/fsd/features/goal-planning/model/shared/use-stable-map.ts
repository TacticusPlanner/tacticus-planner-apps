import { useState } from "react"
import { replaceEqualDeep } from "@tanstack/react-query"

function stabilize<V>(
  previous: ReadonlyMap<string, V>,
  next: ReadonlyMap<string, V>
) {
  let same = previous.size === next.size
  const merged = new Map<string, V>()
  for (const [key, value] of next) {
    const reused = replaceEqualDeep(previous.get(key), value)
    if (reused !== previous.get(key)) same = false
    merged.set(key, reused)
  }
  return same ? previous : merged
}

/** Reuses the previous entry for every key whose value is structurally unchanged (and the previous
 *  map when nothing changed). Per-goal maps are recomputed into fresh objects on each render or plan
 *  run, which would otherwise defeat the memoized goal rows of goals a status toggle didn't touch. */
export function useStableMap<V>(next: ReadonlyMap<string, V>) {
  const [stable, setStable] = useState(next)
  const result = stabilize(stable, next)
  if (result !== stable) setStable(result)
  return result
}
