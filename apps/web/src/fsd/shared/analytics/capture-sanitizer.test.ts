import type { CaptureResult } from "posthog-js"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetReportedRoutePattern,
  sanitizeCapture,
  setReportedRoutePattern,
} from "./capture-sanitizer"
import { recordInteraction } from "./web-vitals-routes"

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
  vi.restoreAllMocks()
})

/** Reports `routePattern` as if its page view were sent at `atMs` (performance.now() time). */
function visit(routePattern: string, atMs: number) {
  vi.spyOn(performance, "now").mockReturnValueOnce(atMs)
  setReportedRoutePattern(routePattern, routePattern)
}

describe("sanitizeCapture", () => {
  it("tags every event with the app version", () => {
    vi.stubEnv("VITE_APP_VERSION", "1.2.3")

    expect(sanitizeCapture(capture()).properties.app_version).toBe("1.2.3")
    expect(
      sanitizeCapture(capture({ event: "$exception" })).properties.app_version
    ).toBe("1.2.3")
  })

  it("leaves app_version unset when the build has no version", () => {
    vi.stubEnv("VITE_APP_VERSION", "")

    expect(sanitizeCapture(capture()).properties).not.toHaveProperty(
      "app_version"
    )
  })

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

  it("labels a web vitals metric with the route it was measured on", () => {
    setReportedRoutePattern(
      "/library/characters/:entityId",
      "/library/characters/ultraInceptorSgt"
    )
    // The user moved on before the metric was sent.
    setReportedRoutePattern("/home", "/home")
    const measuredOn =
      "https://tacticusplanner.app/library/characters/ultraInceptorSgt"

    const { properties } = sanitizeCapture(
      capture({
        event: "$web_vitals",
        properties: {
          $current_url: measuredOn,
          $web_vitals_LCP_event: {
            name: "LCP",
            $current_url: measuredOn,
            attribution: {
              target: "main>div.grid>img",
              url: "https://tacticusplanner.app/game_catalog/x.webp?v=1",
            },
          },
        },
      })
    )

    expect(properties.$pathname).toBe("/library/characters/:entityId")
    expect(properties.$current_url).toBe(
      "https://tacticusplanner.app/library/characters/:entityId"
    )
    expect(properties.$web_vitals_LCP_event).toEqual({
      name: "LCP",
      $current_url: "https://tacticusplanner.app/library/characters/:entityId",
      attribution: {
        target: "main>div.grid>img",
        url: "https://tacticusplanner.app/game_catalog/x.webp",
      },
    })
  })

  it("falls back to the current pattern for a path never reported", () => {
    setReportedRoutePattern("/legendary-events/:eventId", "/legendary-events/1")

    const { properties } = sanitizeCapture(
      capture({
        event: "$web_vitals",
        properties: {
          $current_url: "https://tacticusplanner.app/legendary-events/2?x=1",
        },
      })
    )

    expect(properties.$pathname).toBe("/legendary-events/:eventId")
    expect(properties.$current_url).toBe(
      "https://tacticusplanner.app/legendary-events/:eventId"
    )
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

  describe("CLS and INP sent after the user moved on", () => {
    const homeUrl = "https://tacticusplanner.app/home"

    it("labels CLS with the route of its largest shift", () => {
      visit("/legendary-events/:eventId/:tab", 1000)
      visit("/home", 5000)

      const { properties } = sanitizeCapture(
        capture({
          event: "$web_vitals",
          properties: {
            $current_url: homeUrl,
            $pathname: "/home",
            $web_vitals_CLS_value: 0.4,
            $web_vitals_CLS_event: {
              name: "CLS",
              $current_url: homeUrl,
              attribution: {
                largestShiftTarget: "#le-tab",
                largestShiftTime: 2400,
              },
            },
          },
        })
      )

      expect(properties.web_vitals_cls_route).toBe(
        "/legendary-events/:eventId/:tab"
      )
      expect(properties.$pathname).toBe("/legendary-events/:eventId/:tab")
      expect(properties.$current_url).toBe(
        "https://tacticusplanner.app/legendary-events/:eventId/:tab"
      )
      expect(
        (properties.$web_vitals_CLS_event as { $current_url: string })
          .$current_url
      ).toBe("https://tacticusplanner.app/legendary-events/:eventId/:tab")
    })

    it("labels INP with the route of the interaction it reports", () => {
      visit("/plan/goals", 1000)
      recordInteraction(7, 480, 1500)
      visit("/home", 5000)
      recordInteraction(8, 120, 6000)

      const { properties } = sanitizeCapture(
        capture({
          event: "$web_vitals",
          properties: {
            $current_url: homeUrl,
            $web_vitals_INP_value: 480,
            $web_vitals_INP_event: { name: "INP", $current_url: homeUrl },
          },
        })
      )

      expect(properties.web_vitals_inp_route).toBe("/plan/goals")
      expect(properties.$pathname).toBe("/plan/goals")
    })

    it("keeps one label per metric when CLS and INP come from different pages", () => {
      visit("/legendary-events/:eventId", 1000)
      visit("/home", 5000)
      recordInteraction(3, 600, 5500)

      const { properties } = sanitizeCapture(
        capture({
          event: "$web_vitals",
          properties: {
            $current_url: homeUrl,
            $pathname: "/home",
            $web_vitals_CLS_value: 0.3,
            $web_vitals_CLS_event: {
              name: "CLS",
              $current_url: homeUrl,
              attribution: { largestShiftTime: 1200 },
            },
            $web_vitals_INP_value: 600,
            $web_vitals_INP_event: { name: "INP", $current_url: homeUrl },
          },
        })
      )

      expect(properties.web_vitals_cls_route).toBe("/legendary-events/:eventId")
      expect(properties.web_vitals_inp_route).toBe("/home")
      // No single page: the event keeps the route open when it was sent.
      expect(properties.$pathname).toBe("/home")
    })

    it("falls back to the metric's own URL when the interaction is unknown", () => {
      visit("/plan/goals", 1000)
      visit("/home", 5000)

      const { properties } = sanitizeCapture(
        capture({
          event: "$web_vitals",
          properties: {
            $current_url: homeUrl,
            $web_vitals_INP_value: 999,
            $web_vitals_INP_event: { name: "INP", $current_url: homeUrl },
          },
        })
      )

      expect(properties.web_vitals_inp_route).toBe("/home")
    })
  })
})
