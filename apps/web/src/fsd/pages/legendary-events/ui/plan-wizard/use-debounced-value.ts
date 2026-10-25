import { useEffect, useState } from "react"

/** `value`, once it has stopped changing for `delayMs` (the same reference, so a settled value
 *  compares equal to the live one). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    if (Object.is(settled, value)) return undefined
    const timer = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, settled, delayMs])
  return settled
}
