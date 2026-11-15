import type Dexie from "dexie"

// WebKit drops an open IndexedDB connection while a tab sits in the background ("Connection to
// Indexed Database server lost", "An internal error was encountered in the Indexed Database
// server"), and every later request on that connection fails until it is reopened. Dexie surfaces
// it as UnknownError or DatabaseClosedError, and a transaction that was running at the time fails
// with AbortError. None of these commit anything, so the operation is safe to run again.
const lostConnectionErrorNames = new Set([
  "UnknownError",
  "DatabaseClosedError",
  "AbortError",
])

export function isLostConnectionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string" &&
    lostConnectionErrorNames.has(error.name)
  )
}

/**
 * Wraps a database's operations so one that fails on a lost connection reopens the database and runs
 * once more before the error reaches its caller. Concurrent failures share one reopen, and an
 * operation that started on a connection that has already been replaced only retries: closing again
 * would abort the operations already running on the fresh connection.
 */
export function createReconnectingRunner(db: Dexie) {
  let reopening: Promise<void> | null = null

  function reopen(): Promise<void> {
    reopening ??= (async () => {
      db.close({ disableAutoOpen: false })
      await db.open()
    })().finally(() => {
      reopening = null
    })
    return reopening
  }

  return async function run<T>(operation: () => Promise<T>): Promise<T> {
    const connection = db.isOpen() ? db.backendDB() : null
    try {
      return await operation()
    } catch (error) {
      if (!isLostConnectionError(error)) throw error
      if (reopening) {
        await reopening
      } else if (!db.isOpen() || db.backendDB() === connection) {
        await reopen()
      }
      return operation()
    }
  }
}
