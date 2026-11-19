import { describe, expect, it, vi } from "vitest"

import { runCatching, runWithCleanup } from "./run-with-cleanup"

describe("runWithCleanup", () => {
  it("resolves with the task's value, then cleans up", async () => {
    const cleanup = vi.fn()
    await expect(
      runWithCleanup(() => Promise.resolve(3), cleanup)
    ).resolves.toBe(3)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it("rethrows the task's error after cleaning up", async () => {
    const cleanup = vi.fn()
    const failure = new Error("boom")
    await expect(
      runWithCleanup(() => Promise.reject(failure), cleanup)
    ).rejects.toBe(failure)
    expect(cleanup).toHaveBeenCalledOnce()
  })
})

describe("runCatching", () => {
  it("resolves with the task's value", async () => {
    await expect(
      runCatching(
        () => Promise.resolve(1),
        () => 0
      )
    ).resolves.toBe(1)
  })

  it("resolves with onError's value when the task throws", async () => {
    const failure = new Error("boom")
    const onError = vi.fn(() => 0)
    await expect(
      runCatching(() => Promise.reject(failure), onError)
    ).resolves.toBe(0)
    expect(onError).toHaveBeenCalledWith(failure)
  })
})
