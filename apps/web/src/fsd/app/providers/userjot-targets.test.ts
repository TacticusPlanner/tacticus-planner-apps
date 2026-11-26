import { describe, expect, it, vi } from "vitest"

vi.mock("@/widgets/app-install", () => ({ isRunningInstalled: () => false }))

import {
  readUserJotDeepLink,
  userJotTokenContext,
  withoutUserJotDeepLink,
} from "./userjot-targets"

describe("readUserJotDeepLink", () => {
  it("reads a changelog post", () => {
    expect(readUserJotDeepLink(new URLSearchParams("changelog=abc"))).toEqual({
      to: "updates",
      updateId: "abc",
    })
  })

  it("reads a feedback request", () => {
    expect(readUserJotDeepLink(new URLSearchParams("feedback=req"))).toEqual({
      to: "feedback",
      submissionId: "req",
    })
  })

  it("prefers the changelog post when both are present", () => {
    expect(
      readUserJotDeepLink(new URLSearchParams("feedback=req&changelog=abc"))
    ).toEqual({ to: "updates", updateId: "abc" })
  })

  it("ignores empty or oversized ids", () => {
    expect(readUserJotDeepLink(new URLSearchParams("changelog="))).toBeNull()
    expect(
      readUserJotDeepLink(new URLSearchParams(`feedback=${"x".repeat(65)}`))
    ).toBeNull()
    expect(readUserJotDeepLink(new URLSearchParams("tab=raids"))).toBeNull()
  })
})

describe("withoutUserJotDeepLink", () => {
  it("drops both deep-link params and keeps the rest", () => {
    const next = withoutUserJotDeepLink(
      new URLSearchParams("changelog=a&feedback=b&tab=raids")
    )
    expect(next.toString()).toBe("tab=raids")
  })
})

describe("userJotTokenContext", () => {
  it("reports the browser mode and the given language", () => {
    expect(userJotTokenContext("fr")).toMatchObject({
      appMode: "browser",
      language: "fr",
    })
  })
})
