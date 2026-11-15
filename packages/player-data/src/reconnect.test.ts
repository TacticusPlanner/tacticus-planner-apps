import Dexie from "dexie"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createReconnectingRunner, isLostConnectionError } from "./reconnect"

function namedError(name: string, message = name) {
  const error = new Error(message)
  error.name = name
  return error
}

describe("isLostConnectionError", () => {
  it.each(["UnknownError", "DatabaseClosedError", "AbortError"])(
    "recognises %s",
    (name) => {
      expect(isLostConnectionError(namedError(name))).toBe(true)
    }
  )

  it("ignores other errors", () => {
    expect(isLostConnectionError(namedError("QuotaExceededError"))).toBe(false)
    expect(isLostConnectionError(new TypeError("boom"))).toBe(false)
    expect(isLostConnectionError("UnknownError")).toBe(false)
    expect(isLostConnectionError(null)).toBe(false)
  })
})

describe("createReconnectingRunner", () => {
  let db: Dexie

  beforeEach(async () => {
    db = new Dexie(`reconnect-test-${Math.random()}`)
    db.version(1).stores({ items: "id" })
    await db.open()
  })

  afterEach(async () => {
    await db.delete()
  })

  it("returns the result without reopening when the operation succeeds", async () => {
    const run = createReconnectingRunner(db)
    const close = vi.spyOn(db, "close")

    await expect(run(() => Promise.resolve(42))).resolves.toBe(42)
    expect(close).not.toHaveBeenCalled()
  })

  it("reopens the database and retries once after a lost connection", async () => {
    const run = createReconnectingRunner(db)
    const close = vi.spyOn(db, "close")
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(
        namedError(
          "UnknownError",
          "Connection to Indexed Database server lost. Refresh the page to try again"
        )
      )
      .mockResolvedValueOnce("ok")

    await expect(run(operation)).resolves.toBe("ok")
    expect(operation).toHaveBeenCalledTimes(2)
    expect(close).toHaveBeenCalledTimes(1)
    expect(db.isOpen()).toBe(true)
    await expect(db.table("items").count()).resolves.toBe(0)
  })

  it("rethrows when the retry fails too", async () => {
    const run = createReconnectingRunner(db)
    const lost = namedError("DatabaseClosedError")
    const operation = vi.fn<() => Promise<never>>().mockRejectedValue(lost)

    await expect(run(operation)).rejects.toBe(lost)
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it("does not retry other errors", async () => {
    const run = createReconnectingRunner(db)
    const failure = new TypeError("bad data")
    const operation = vi.fn<() => Promise<never>>().mockRejectedValue(failure)

    await expect(run(operation)).rejects.toBe(failure)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it("shares one reopen between operations that fail together", async () => {
    const run = createReconnectingRunner(db)
    const close = vi.spyOn(db, "close")
    const failOnce = () =>
      vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(namedError("AbortError"))
        .mockResolvedValueOnce("ok")

    await expect(
      Promise.all([run(failOnce()), run(failOnce())])
    ).resolves.toEqual(["ok", "ok"])
    expect(close).toHaveBeenCalledTimes(1)
  })

  it("only retries an operation whose connection was already replaced", async () => {
    const run = createReconnectingRunner(db)
    let fail: (error: Error) => void = () => {}
    const slow = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            fail = reject
          })
      )
      .mockResolvedValueOnce("slow ok")
    const slowRun = run(slow)

    await run(
      vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(namedError("UnknownError"))
        .mockResolvedValueOnce("fast ok")
    )
    const close = vi.spyOn(db, "close")
    fail(namedError("UnknownError"))

    await expect(slowRun).resolves.toBe("slow ok")
    expect(close).not.toHaveBeenCalled()
  })
})
