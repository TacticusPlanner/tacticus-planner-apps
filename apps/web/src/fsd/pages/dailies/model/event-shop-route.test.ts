import { describe, expect, it } from "vitest"

import {
  defaultEventId,
  normalizeEventShopTab,
  parseEventShopDay,
} from "./event-shop-route"

const events = [
  { id: "june-2026", startUtc: "2026-06-22T00:00:00Z", dayCount: 7 },
  { id: "august-2026", startUtc: "2026-08-02T00:00:00Z", dayCount: 21 },
  { id: "october-2026", startUtc: "2026-10-26T00:00:00Z", dayCount: 7 },
]
const at = (iso: string) => Date.parse(iso)

describe("defaultEventId", () => {
  it("picks the running event", () => {
    expect(defaultEventId(events, at("2026-10-29T12:00:00Z"))).toBe(
      "october-2026"
    )
  })

  it("picks the next upcoming event between events", () => {
    expect(defaultEventId(events, at("2026-09-10T12:00:00Z"))).toBe(
      "october-2026"
    )
  })

  it("picks the most recently started event after the last one", () => {
    expect(defaultEventId(events, at("2026-11-09T12:00:00Z"))).toBe(
      "october-2026"
    )
  })

  it("is null without events", () => {
    expect(defaultEventId([], at("2026-11-09T12:00:00Z"))).toBeNull()
  })
})

describe("normalizeEventShopTab", () => {
  it.each([
    ["plan", "desktop", "shop"],
    ["rewards", "tablet", "milestones"],
    ["missions", "phone", "rewards"],
    ["milestones", "phone", "rewards"],
    ["plan", "phone", "plan"],
    ["missions", "desktop", "missions"],
    [null, "desktop", "shop"],
    ["nonsense", "phone", "shop"],
  ] as const)("maps %s on %s to %s", (value, form, tab) => {
    expect(normalizeEventShopTab(value, form)).toBe(tab)
  })
})

describe("parseEventShopDay", () => {
  it("reads an in-range day", () => {
    expect(parseEventShopDay("8", 21)).toBe(8)
  })

  it.each([null, "21", "-1", "x", "1.5"])("ignores %s", (value) => {
    expect(parseEventShopDay(value, 21)).toBeNull()
  })
})
