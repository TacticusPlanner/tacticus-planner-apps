import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import { isTacticusUserId, tacticusUserIdProblem } from "./tacticus-user-id"

describe("isTacticusUserId", () => {
  it.each([
    "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "  3F2504E0-4F89-11D3-9A0C-0305E82C3301 ",
    "3f2504e04f8911d39a0c0305e82c3301",
    "{3f2504e0-4f89-11d3-9a0c-0305e82c3301}",
    "(3f2504e0-4f89-11d3-9a0c-0305e82c3301)",
  ])("accepts %s", (value) => {
    expect(isTacticusUserId(value)).toBe(true)
  })

  it.each([
    "",
    "player-123",
    "3f2504e0-4f89-11d3-9a0c-0305e82c330",
    "3f2504e0-4f8911d3-9a0c-0305e82c3301",
    "{3f2504e0-4f89-11d3-9a0c-0305e82c3301)",
    "3g2504e0-4f89-11d3-9a0c-0305e82c3301",
  ])("rejects %s", (value) => {
    expect(isTacticusUserId(value)).toBe(false)
  })
})

describe("tacticusUserIdProblem", () => {
  it("reads 409 tacticusUserIdInUse as inUse", () => {
    expect(
      tacticusUserIdProblem(
        new ApiError(409, "taken", { issueCode: "tacticusUserIdInUse" })
      )
    ).toBe("inUse")
  })

  it("reads a 400 naming the user id field as invalid", () => {
    expect(
      tacticusUserIdProblem(
        new ApiError(400, "not a GUID", {
          issueCode: "validation",
          errors: { tacticusUserId: ["The Tacticus user id must be a GUID."] },
        })
      )
    ).toBe("invalid")
  })

  it("leaves other failures to the form", () => {
    expect(
      tacticusUserIdProblem(
        new ApiError(400, "bad key", {
          issueCode: "validation",
          errors: { tacticusApiKey: ["The key could not be validated."] },
        })
      )
    ).toBeNull()
    expect(tacticusUserIdProblem(new Error("network"))).toBeNull()
  })
})
