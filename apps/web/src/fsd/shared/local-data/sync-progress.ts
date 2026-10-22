/** A tiny external store for sync progress, read with `useSyncExternalStore`, so every mounted
 *  provider sees the progress of the one shared sync run. */
export function createProgressStore<P>() {
  let value: P | null = null
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set(next: P | null) {
      value = next
      for (const listener of listeners) listener()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
