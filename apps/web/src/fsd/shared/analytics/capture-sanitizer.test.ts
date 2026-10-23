import type { CaptureResult } from "posthog-js"
import { afterEach, describe, expect, it } from "vitest"

import {
  resetReportedRoutePattern,
  sanitizeCapture,
  setReportedRoutePattern,
} from "./capture-sanitizer"

function capture(overrides: Partial<CaptureResult> = {}): CaptureResult {
  return {
    uuid: "uuid",
    event: "$pageview",
    properties: {
      $current_url:
        "https://tacticusplanner.app/library/characters/ultraInceptorSgt?tab=2#x",
      $pathname: "/library/characters/ultraInceptorSgt",
      $referrer: "https://example.com/page?token=secret",
      route_pattern: "/library/characters/:entityId",
    },
    ...overrides,
  }
}

afterEach(() => {
  resetReportedRoutePattern()
})

describe("sanitizeCapture", () => {
  it("rewrites the current URL and path to the reported route pattern", () => {
    setReportedRoutePattern("/library/characters/:entityId")

    const { properties } = sanitizeCapture(capture())

    expect(properties.$current_url).toBe(
      "https://tacticusplanner.app/library/characters/:entityId"
    )
    expect(properties.$pathname).toBe("/library/characters/:entityId")
  })

  it("cuts query strings and hashes from every URL-valued property", () => {
    const result = sanitizeCapture(
      capture({
        $set_once: {
          $initial_current_url:
            "https://tacticusplanner.app/setup?next=%2Fhome",
        },
      })
    )

    expect(result.properties.$current_url).toBe(
      "https://tacticusplanner.app/library/characters/ultraInceptorSgt"
    )
    expect(result.properties.$referrer).toBe("https://example.com/page")
    expect(result.$set_once?.$initial_current_url).toBe(
      "https://tacticusplanner.app/setup"
    )
  })

  it("leaves non-URL properties untouched", () => {
    const { properties } = sanitizeCapture(capture())

    expect(properties.route_pattern).toBe("/library/characters/:entityId")
  })
})
