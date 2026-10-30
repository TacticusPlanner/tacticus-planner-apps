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

  it("redacts the page URL nested in web vitals metrics", () => {
    setReportedRoutePattern("/library/characters/:entityId")
    const pageUrl =
      "https://tacticusplanner.app/library/characters/ultraInceptorSgt?tab=2"

    const { properties } = sanitizeCapture(
      capture({
        event: "$web_vitals",
        properties: {
          $current_url: pageUrl,
          $web_vitals_LCP_event: {
            name: "LCP",
            $current_url: pageUrl,
            navigationURL: pageUrl,
          },
        },
      })
    )

    expect(properties.$web_vitals_LCP_event).toEqual({
      name: "LCP",
      $current_url: "https://tacticusplanner.app/library/characters/:entityId",
      navigationURL: "https://tacticusplanner.app/library/characters/:entityId",
    })
  })

  it("reports the previous page's route pattern, not its concrete path", () => {
    setReportedRoutePattern("/legendary-events/:eventId/plan")
    setReportedRoutePattern("/library/characters/:entityId")

    const pageview = sanitizeCapture(
      capture({
        properties: {
          $current_url:
            "https://tacticusplanner.app/library/characters/ultraInceptorSgt",
          $prev_pageview_pathname: "/legendary-events/shadowsun/plan",
        },
      })
    )
    const pageleave = sanitizeCapture(
      capture({
        event: "$pageleave",
        properties: {
          $current_url:
            "https://tacticusplanner.app/library/characters/ultraInceptorSgt",
          $prev_pageview_pathname: "/library/characters/ultraInceptorSgt",
        },
      })
    )

    expect(pageview.properties.$prev_pageview_pathname).toBe(
      "/legendary-events/:eventId/plan"
    )
    expect(pageleave.properties.$prev_pageview_pathname).toBe(
      "/library/characters/:entityId"
    )
  })

  it("drops the previous path when no previous pattern was reported", () => {
    setReportedRoutePattern("/home")

    const { properties } = sanitizeCapture(
      capture({
        properties: {
          $current_url: "https://tacticusplanner.app/home",
          $prev_pageview_pathname: "/library/characters/ultraInceptorSgt",
        },
      })
    )

    expect(properties).not.toHaveProperty("$prev_pageview_pathname")
  })

  it("leaves non-URL properties untouched", () => {
    const { properties } = sanitizeCapture(capture())

    expect(properties.route_pattern).toBe("/library/characters/:entityId")
  })
})
