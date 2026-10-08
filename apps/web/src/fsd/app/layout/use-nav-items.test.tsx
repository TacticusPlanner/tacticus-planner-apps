import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"

const events = vi.hoisted(() => ({
  state: { status: "loading" } as unknown,
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  useLegendaryEvents: () => events.state,
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) =>
    ({ astarLysander: "Lysander", votanUthar: "Uthar" })[id] ?? id,
}))

import { useNavItems } from "./use-nav-items"

// Both fixtures run on 2026-09-02: Lysander's real 2026-08-30 start and Uthar's pinned future
// start are moved onto the same day so two events are active at once.
const NOW = Date.parse("2026-09-02T12:00:00Z")
const uthar = {
  ...utharEvent,
  eventStageStartDatesUtc: ["2026-09-01T00:00:00Z"],
}

async function renderNavItems() {
  const i18n = await createTestI18n("en")
  const { result } = renderHook(() => useNavItems(), {
    wrapper: i18nWrapper(i18n),
  })
  return result.current
}

function legendaryEventsChildren(items: ReturnType<typeof useNavItems>) {
  return items.find((item) => item.path === "/legendary-events")?.children
}

describe("useNavItems", () => {
  beforeEach(() => {
    events.state = { status: "loading", retry: vi.fn(), nowMs: NOW }
  })

  it("lists All events, then two active events by run start", async () => {
    events.state = {
      status: "ready",
      data: [uthar, lysanderEvent],
      retry: vi.fn(),
      nowMs: NOW,
    }
    const children = legendaryEventsChildren(await renderNavItems())

    expect(children?.map((child) => child.path)).toEqual([
      "/legendary-events",
      "/legendary-events/astarLysander",
      "/legendary-events/votanUthar",
    ])
    expect(children?.[0]).toMatchObject({
      labelKey: "legendaryEvents.tabs.allEvents",
      isLandingPage: true,
    })
    expect(children?.[1]).toMatchObject({
      label: "Lysander",
      description: "Active Legendary Event with your synced progress",
      iconSrc: expect.stringContaining("astar_lysander"),
    })
  })

  it("lists upcoming and archived events after the active ones, each with its lifecycle", async () => {
    // Uthar archived (finished), Lysander upcoming before its 2026-08-30 start.
    events.state = {
      status: "ready",
      data: [lysanderEvent, { ...utharEvent, finished: true }],
      retry: vi.fn(),
      nowMs: Date.parse("2026-08-01T00:00:00Z"),
    }
    const children = legendaryEventsChildren(await renderNavItems())

    expect(children?.map((child) => child.path)).toEqual([
      "/legendary-events",
      "/legendary-events/astarLysander",
      "/legendary-events/votanUthar",
    ])
    expect(children?.[1]).toMatchObject({
      label: "Lysander",
      description: "Upcoming Legendary Event",
    })
    expect(children?.[2]).toMatchObject({
      label: "Uthar",
      description: "Past Legendary Event with your synced progress",
    })
  })

  it("keeps only All events while the read is pending or failed", async () => {
    expect(
      legendaryEventsChildren(await renderNavItems())?.map(
        (child) => child.path
      )
    ).toEqual(["/legendary-events"])

    events.state = { status: "error", retry: vi.fn(), nowMs: NOW }
    expect(
      legendaryEventsChildren(await renderNavItems())?.map(
        (child) => child.path
      )
    ).toEqual(["/legendary-events"])
  })

  it("leaves every other section untouched", async () => {
    const items = await renderNavItems()
    expect(items.find((item) => item.path === "/plan")?.children).toHaveLength(
      4
    )
  })
})
