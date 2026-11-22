import { describe, expect, it } from "vitest"

import { environmentBadgeLabelKey } from "./environment-badge"

describe("environmentBadgeLabelKey", () => {
  it("labels staging builds as staging", () => {
    expect(environmentBadgeLabelKey("staging")).toBe("app.staging")
  })

  it("keeps the beta mark in production and locally", () => {
    expect(environmentBadgeLabelKey("production")).toBe("app.beta")
    expect(environmentBadgeLabelKey("local")).toBe("app.beta")
  })
})
