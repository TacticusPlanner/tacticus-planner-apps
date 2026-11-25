import { describe, expect, it } from "vitest"

import { withCardProgress } from "./with-card-progress"

describe("withCardProgress", () => {
  it("adds progress to loaded summaries only", () => {
    const retry = () => undefined
    const merged = withCardProgress(
      new Map([
        ["a", { status: "success" as const, units: 1, goals: 2 }],
        ["b", { status: "loading" as const }],
        ["c", { status: "error" as const, retry }],
        ["d", { status: "success" as const, units: 0, goals: 0 }],
      ]),
      new Map([
        ["a", { status: "loading" as const }],
        ["b", { status: "loading" as const }],
        ["c", { status: "loading" as const }],
      ])
    )
    expect(merged.get("a")).toEqual({
      status: "success",
      units: 1,
      goals: 2,
      progress: { status: "loading" },
    })
    expect(merged.get("b")).toEqual({ status: "loading" })
    expect(merged.get("c")).toEqual({ status: "error", retry })
    expect(merged.get("d")).toEqual({ status: "success", units: 0, goals: 0 })
  })
})
