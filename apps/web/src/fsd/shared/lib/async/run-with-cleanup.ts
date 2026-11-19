// React Compiler can't lower a `finally` clause, or a conditional inside a `try`, and skips any hook
// that has one. Hooks call these instead, keeping the `try` outside the compiled function.

/** Runs `task`, then `cleanup` whether it resolved or threw: `try { … } finally { … }`. */
export async function runWithCleanup<T>(
  task: () => Promise<T>,
  cleanup: () => void
): Promise<T> {
  try {
    return await task()
  } finally {
    cleanup()
  }
}

/** Runs `task`; if it throws, resolves with `onError`'s result instead: `try { … } catch { … }`. */
export async function runCatching<T>(
  task: () => Promise<T>,
  onError: (error: unknown) => T
): Promise<T> {
  try {
    return await task()
  } catch (error) {
    return onError(error)
  }
}
