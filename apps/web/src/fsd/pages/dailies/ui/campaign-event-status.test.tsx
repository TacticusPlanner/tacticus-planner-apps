import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { campaignIdSchema } from "@workspace/game-domain"

const { useLiveQueryMock } = vi.hoisted(() => ({ useLiveQueryMock: vi.fn() }))

vi.mock("dexie-react-hooks", () => ({ useLiveQuery: () => useLiveQueryMock() }))
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))

import { availableCampaignBattles } from "@/features/daily-raids"

import { CampaignEventStatusLine } from "./campaign-event-status"
import {
  buildCampaignEventStatus,
  type CampaignEventWindow,
} from "./use-campaign-event-status"

// "eventCampaign4" is Adepta Sororitas vs Death Guard in the catalog's event-group map.
const knownId = campaignIdSchema.parse("eventCampaign4")
const unknownId = campaignIdSchema.parse("eventCampaign99")
const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString()
const confirmedWindow: CampaignEventWindow = {
  endUtc: inThreeDays,
  confirmed: true,
}
const unconfirmedWindow: CampaignEventWindow = {
  endUtc: inThreeDays,
  confirmed: false,
}

describe("buildCampaignEventStatus", () => {
  const campaignName = (groupId: string) =>
    groupId === knownId ? "Adepta Sororitas" : null

  it.each([
    [
      "detected and named, with a confirmed active calendar window",
      knownId,
      confirmedWindow,
      { active: true, name: "Adepta Sororitas", endStatusKind: "confirmed" },
    ],
    [
      "detected and named, with an unconfirmed projected calendar window",
      knownId,
      unconfirmedWindow,
      {
        active: true,
        name: "Adepta Sororitas",
        endStatusKind: "unconfirmed",
      },
    ],
    [
      "detected and named, with no calendar window",
      knownId,
      null,
      { active: true, name: "Adepta Sororitas", endStatusKind: "unavailable" },
    ],
    [
      "detected but unnamed, with a confirmed active calendar window",
      unknownId,
      confirmedWindow,
      { active: true, name: null, endStatusKind: "confirmed" },
    ],
    [
      "detected but unnamed, with an unconfirmed projected calendar window",
      unknownId,
      unconfirmedWindow,
      { active: true, name: null, endStatusKind: "unconfirmed" },
    ],
    [
      "detected but unnamed, with no calendar window",
      unknownId,
      null,
      { active: true, name: null, endStatusKind: "unavailable" },
    ],
    [
      "not detected, but the calendar has a confirmed active window",
      null,
      confirmedWindow,
      { active: false, name: null, endStatusKind: "unavailable" },
    ],
    [
      "not detected, with no calendar window",
      null,
      null,
      { active: false, name: null, endStatusKind: "unavailable" },
    ],
  ] as const)(
    "reports %s",
    (_case, activeCampaignEventId, campaignEventWindow, expected) => {
      const status = buildCampaignEventStatus({
        activeCampaignEventId,
        campaignEventWindow,
        nowMs: Date.now(),
        campaignName,
      })

      expect({
        active: status.active,
        name: status.name,
        endStatusKind: status.endStatus.kind,
      }).toEqual(expected)
    }
  )
})

describe("CampaignEventStatusLine", () => {
  beforeEach(() => useLiveQueryMock.mockReset())

  function renderWith(
    activeCampaignEventId: typeof knownId | null,
    campaignEventWindow: CampaignEventWindow | null
  ) {
    useLiveQueryMock.mockReturnValue({
      nowMs: Date.now(),
      activeCampaignEventId,
      campaignEventWindow,
    })
    render(<CampaignEventStatusLine />)
    return screen.getByTestId("campaign-event-status")
  }

  const detailOf = (element: HTMLElement) =>
    element.lastElementChild?.textContent ?? ""

  it("heads the block with the campaign-event label at the schedule's own heading weight", () => {
    const heading = renderWith(knownId, confirmedWindow).querySelector("h2")
    expect(heading?.textContent).toBe("today.campaignEvent.title")
    expect(heading).toHaveClass("text-lg", "font-semibold")
  })

  it("shows the detected event's campaign icon", () => {
    const image = renderWith(knownId, confirmedWindow).querySelector("img")
    expect(image?.getAttribute("src")).toContain(
      "adepta-sororitas-vs-death-guard"
    )
  })

  it("carries no icon when no event is detected", () => {
    expect(renderWith(null, confirmedWindow).querySelector("img")).toBeNull()
  })

  it("names the detected event and its remaining time for a confirmed window", () => {
    const text = detailOf(renderWith(knownId, confirmedWindow))
    expect(text).toContain("today.campaignEvent.namedWithTime")
    // The t-mock echoes keys, so the resolved campaign name shows up as its own name key.
    expect(text).toContain("adepta-sororitas-vs-death-guard")
    expect(text).toContain("in 3 days")
  })

  it("names the detected event and states its end time is unconfirmed, without a numeric countdown", () => {
    const text = detailOf(renderWith(knownId, unconfirmedWindow))
    expect(text).toContain("today.campaignEvent.namedUnconfirmed")
    expect(text).toContain("adepta-sororitas-vs-death-guard")
    expect(text).not.toContain("in 3 days")
    expect(text).not.toContain("namedWithTime")
  })

  it("names the detected event without a time when the calendar has no active window", () => {
    const text = detailOf(renderWith(knownId, null))
    expect(text).toContain("today.campaignEvent.named:")
    expect(text).not.toContain("namedWithTime")
    expect(text).not.toContain("namedUnconfirmed")
  })

  it("reports an unresolvable event as active without ever showing its raw group id", () => {
    const text = detailOf(renderWith(unknownId, confirmedWindow))
    expect(text).toContain("today.campaignEvent.unnamedWithTime")
    expect(text).toContain("in 3 days")
    expect(text).not.toContain(unknownId)
  })

  it("reports an unresolvable event with an unconfirmed window as active and unconfirmed, untimed", () => {
    const text = detailOf(renderWith(unknownId, unconfirmedWindow))
    expect(text).toContain("today.campaignEvent.unnamedUnconfirmed")
    expect(text).not.toContain("in 3 days")
    expect(text).not.toContain(unknownId)
  })

  it("reports an unresolvable event with no calendar window as active but untimed", () => {
    expect(detailOf(renderWith(unknownId, null))).toBe(
      "today.campaignEvent.unnamed"
    )
  })

  it("states no event is active when none is detected, even while the calendar shows one — matching the schedule, which drops every event node in that state", () => {
    expect(detailOf(renderWith(null, confirmedWindow))).toBe(
      "today.campaignEvent.inactive"
    )

    const battles = [
      {
        id: "standing",
        campaignGroupId: "campaign1",
        type: "Standard",
        challenge: false,
        nodeNumber: 1,
        battleIndex: 0,
      },
      {
        id: "event",
        campaignGroupId: knownId,
        type: "Standard",
        challenge: false,
        nodeNumber: 1,
        battleIndex: 0,
      },
    ]
    expect(
      availableCampaignBattles(
        battles,
        new Set([knownId]),
        null,
        new Map()
      ).map((battle) => battle.id)
    ).toEqual(["standing"])
  })

  // Task 2.2: proves the catalog's confirmed flag alone drives the switch from unconfirmed
  // projection copy to a real countdown once an authored occurrence replaces the placeholder —
  // no client schema change, no dependency on the (currently blocked) API companion.
  it("switches from unconfirmed text to a confirmed countdown when the catalog refreshes to an authored occurrence", () => {
    useLiveQueryMock.mockReturnValue({
      nowMs: Date.now(),
      activeCampaignEventId: knownId,
      campaignEventWindow: unconfirmedWindow,
    })
    const { rerender } = render(<CampaignEventStatusLine />)
    const before = detailOf(screen.getByTestId("campaign-event-status"))
    expect(before).toContain("today.campaignEvent.namedUnconfirmed")
    expect(before).not.toContain("in 3 days")

    useLiveQueryMock.mockReturnValue({
      nowMs: Date.now(),
      activeCampaignEventId: knownId,
      campaignEventWindow: confirmedWindow,
    })
    rerender(<CampaignEventStatusLine />)
    const after = detailOf(screen.getByTestId("campaign-event-status"))
    expect(after).toContain("today.campaignEvent.namedWithTime")
    expect(after).toContain("in 3 days")
    expect(after).not.toContain("namedUnconfirmed")
  })
})
