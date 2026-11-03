import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import {
  isValidSnapshotRename,
  snapshotNameError,
  takeFailure,
} from "./take-snapshot"

describe("snapshot names", () => {
  it("allows a blank name and up to 60 characters", () => {
    expect(snapshotNameError("")).toBeNull()
    expect(snapshotNameError(` ${"a".repeat(60)} `)).toBeNull()
    expect(snapshotNameError("a".repeat(61))).toEqual({ max: 60 })
  })

  it("requires a rename to be non-blank", () => {
    expect(isValidSnapshotRename("  ")).toBe(false)
    expect(isValidSnapshotRename("Before LE")).toBe(true)
  })
})

describe("takeFailure", () => {
  it("reads the limit and not-synced conflicts without a fallback", () => {
    expect(
      takeFailure(
        new ApiError(409, "", { issueCode: "rosterSnapshotLimitReached" })
      )
    ).toEqual({ kind: "limitReached", canFallBack: false })
    expect(
      takeFailure(new ApiError(409, "", { issueCode: "playerDataNotSynced" }))
    ).toEqual({ kind: "notSynced", canFallBack: false })
  })

  it("offers the fallback on a rate limit and on a failed sync", () => {
    expect(
      takeFailure(new ApiError(429, "", { retryAfterSeconds: 30 }))
    ).toEqual({ kind: "rateLimited", canFallBack: true, retryAfterSeconds: 30 })
    expect(takeFailure(new ApiError(503, ""))).toEqual({
      kind: "syncFailed",
      canFallBack: true,
    })
    expect(takeFailure(new TypeError("offline"))).toEqual({
      kind: "syncFailed",
      canFallBack: true,
    })
  })
})
