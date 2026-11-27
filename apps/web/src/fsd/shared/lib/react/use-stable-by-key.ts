import { useState } from "react"

/**
 * `value`, kept from an earlier render while `key` is unchanged: an identity that follows content
 * (a serialized form, an update stamp) instead of a new array or object on every render. Use it in
 * place of `useMemo(() => value, [key])`, which leaves `value` out of its dependencies.
 */
export function useStableByKey<T>(key: string, value: T): T {
  const [cached, setCached] = useState({ key, value })
  if (cached.key !== key) {
    setCached({ key, value })
    return value
  }
  return cached.value
}
