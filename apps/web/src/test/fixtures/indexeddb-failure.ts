// Watches IndexedDB store reads and can make them throw, so a real Dexie-backed query rejects the
// way a corrupt or blocked store would. Writes are untouched, so seeding still works while reads
// fail. Dexie's live-query cache answers a query some mounted (or just-unmounted, for ~3s) live
// query already ran without reading the store, so fail a read before anything else has made it.
import { vi } from "vitest"

const readMethods = ["get", "getAll", "openCursor"] as const

/** Whether a read from this store or index is targeted: `true` targets every read, a string the
 *  database, store or `database/store` of that name. */
function targets(source: unknown, failing: boolean | string) {
  if (typeof failing === "boolean") return failing
  const store =
    source instanceof IDBIndex ? source.objectStore : (source as IDBObjectStore)
  const database = store.transaction.db.name
  return [store.name, database, `${database}/${store.name}`].includes(failing)
}

export function spyOnIndexedDbReads() {
  let failing: boolean | string = false
  const spies = [IDBObjectStore.prototype, IDBIndex.prototype].flatMap(
    (prototype) =>
      readMethods.map((method) => {
        const original = prototype[method] as (...args: unknown[]) => unknown
        return vi.spyOn(prototype, method).mockImplementation(function (
          this: unknown,
          ...args: unknown[]
        ) {
          if (targets(this, failing)) {
            throw new DOMException("Test read failure", "UnknownError")
          }
          return original.apply(this, args)
        } as never)
      })
  )
  return {
    /** Makes every later read throw (`true`, or a database, store or `database/store` name to fail) or pass
     *  through again (`false`). */
    fail: (value: boolean | string = true) => {
      failing = value
    },
    /** How many store reads were attempted since the spy was installed. */
    calls: () => spies.reduce((sum, spy) => sum + spy.mock.calls.length, 0),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  }
}
