import { afterEach, describe, expect, it } from "vitest"

import {
  recordInteraction,
  recordRouteChange,
  resetWebVitalsRoutes,
  routeAt,
  routeOfInteraction,
} from "./web-vitals-routes"

afterEach(() => {
  resetWebVitalsRoutes()
})

describe("routeAt", () => {
  it("returns the route that was open at a time", () => {
    recordRouteChange("/home", 100)
    recordRouteChange("/plan/goals", 900)

    expect(routeAt(500)).toBe("/home")
    expect(routeAt(900)).toBe("/plan/goals")
    expect(routeAt(5000)).toBe("/plan/goals")
  })

  it("gives a time before the first report to the first route", () => {
    recordRouteChange("/dailies/raids", 3000)

    expect(routeAt(10)).toBe("/dailies/raids")
  })

  it("is null before any route was reported", () => {
    expect(routeAt(10)).toBeNull()
  })
})

describe("routeOfInteraction", () => {
  it("labels an interaction with the route its tap started on", () => {
    recordRouteChange("/legendary-events/:eventId/:tab", 100)
    // The tap navigates: the new route is reported after the tap started.
    recordInteraction(1, 520, 2000)
    recordRouteChange("/home", 2100)

    expect(routeOfInteraction(520)).toBe("/legendary-events/:eventId/:tab")
  })

  it("counts an interaction's longest entry", () => {
    recordRouteChange("/plan/goals", 0)
    recordInteraction(4, 80, 1000)
    recordInteraction(4, 304, 1000)
    recordInteraction(4, 120, 1000)

    expect(routeOfInteraction(304)).toBe("/plan/goals")
    expect(routeOfInteraction(80)).toBeNull()
  })

  it("keeps only the ten slowest interactions", () => {
    recordRouteChange("/home", 0)
    for (let id = 1; id <= 11; id++) recordInteraction(id, id * 100, id)

    expect(routeOfInteraction(100)).toBeNull()
    expect(routeOfInteraction(1100)).toBe("/home")
  })

  it("ignores entries that are not interactions", () => {
    recordRouteChange("/home", 0)
    recordInteraction(0, 700, 10)

    expect(routeOfInteraction(700)).toBeNull()
  })
})
