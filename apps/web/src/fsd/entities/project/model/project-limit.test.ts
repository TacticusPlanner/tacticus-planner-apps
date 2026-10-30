import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import {
  isAtProjectLimit,
  isProjectLimitError,
  MAX_PROJECTS,
} from "./project-limit"

const projects = (status: "Active" | "Archived", count: number) =>
  Array.from({ length: count }, () => ({ status }))

describe("isAtProjectLimit", () => {
  it("counts only non-archived projects", () => {
    expect(isAtProjectLimit(projects("Active", MAX_PROJECTS - 1))).toBe(false)
    expect(
      isAtProjectLimit([
        ...projects("Active", MAX_PROJECTS - 1),
        ...projects("Archived", 5),
      ])
    ).toBe(false)
    expect(isAtProjectLimit(projects("Active", MAX_PROJECTS))).toBe(true)
  })
})

describe("isProjectLimitError", () => {
  it("recognizes the projectLimitReached problem only", () => {
    expect(
      isProjectLimitError(
        new ApiError(400, "cap", { issueCode: "projectLimitReached" })
      )
    ).toBe(true)
    expect(isProjectLimitError(new ApiError(400, "x"))).toBe(false)
  })
})
