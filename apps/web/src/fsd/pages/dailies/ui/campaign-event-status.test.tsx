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
import { buildCampaignEventStatus } from "./use-campaign-event-status"

// "eventCampaign4" is Adepta Sororitas vs Death Guard in the catalog's event-group map.
const knownId = campaignIdSchema.parse("eventCampaign4")
const unknownId = campaignIdSchema.parse("eventCampaign99")
const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString()

describe("buildCampaignEventStatus", () => {
  const campaignName = (groupId: string) =>
    groupId === knownId ? "Adepta Sororitas" : null

  it.each([
    [
      "detected and named, with an active calendar window",
      knownId,
      inThreeDays,
      { active: true, name: "Adepta Sororitas", endsAtKind: "pending" },
    ],
    [
      "detected and named, with no calendar window",
      knownId,
      null,
      { active: true, name: "Adepta Sororitas", endsAtKind: "unavailable" },
    ],
    [
      "detected but unnamed, with an active calendar window",
      unknownId,
      inThreeDays,
      { active: true, name: null, endsAtKind: "pending" },
    ],
    [
      "detected but unnamed, with no calendar window",
      unknownId,
      null,
      { active: true, name: null, endsAtKind: "unavailable" },
    ],
    [
      "not detected, but the calendar has an active window",
      null,
      inThreeDays,
      { active: false, name: null, endsAtKind: "unavailable" },
    ],
    [
      "not detected, with no calendar window",
      null,
      null,
      { active: false, name: null, endsAtKind: "unavailable" },
    ],
  ])(
    "reports %s",
    (_case, activeCampaignEventId, campaignEventEndUtc, expected) => {
      const status = buildCampaignEventStatus({
        activeCampaignEventId,
        campaignEventEndUtc,
        nowMs: Date.now(),
        campaignName,
      })

      expect({
        active: status.active,
        name: status.name,
        endsAtKind: status.endsAt.kind,
      }).toEqual(expected)
    }
  )
})

describe("CampaignEventStatusLine", () => {
  beforeEach(() => useLiveQueryMock.mockReset())

  function renderWith(
    activeCampaignEventId: typeof knownId | null,
    campaignEventEndUtc: string | null
  ) {
    useLiveQueryMock.mockReturnValue({
      nowMs: Date.now(),
      activeCampaignEventId,
      campaignEventEndUtc,
    })
    render(<CampaignEventStatusLine />)
    return screen.getByTestId("campaign-event-status")
  }

  const detailOf = (element: HTMLElement) =>
    element.lastElementChild?.textContent ?? ""

  it("heads the block with the campaign-event label at the schedule's own heading weight", () => {
    const heading = renderWith(knownId, inThreeDays).querySelector("h2")
    expect(heading?.textContent).toBe("today.campaignEvent.title")
    expect(heading).toHaveClass("text-lg", "font-semibold")
  })

  it("shows the detected event's campaign icon", () => {
    const image = renderWith(knownId, inThreeDays).querySelector("img")
    expect(image?.getAttribute("src")).toContain(
      "adepta-sororitas-vs-death-guard"
    )
  })

  it("carries no icon when no event is detected", () => {
    expect(renderWith(null, inThreeDays).querySelector("img")).toBeNull()
  })

  it("names the detected event and its remaining time", () => {
    const text = detailOf(renderWith(knownId, inThreeDays))
    expect(text).toContain("today.campaignEvent.namedWithTime")
    // The t-mock echoes keys, so the resolved campaign name shows up as its own name key.
    expect(text).toContain("adepta-sororitas-vs-death-guard")
    expect(text).toContain("in 3 days")
  })

  it("names the detected event without a time when the calendar has no active window", () => {
    const text = detailOf(renderWith(knownId, null))
    expect(text).toContain("today.campaignEvent.named:")
    expect(text).not.toContain("namedWithTime")
  })

  it("reports an unresolvable event as active without ever showing its raw group id", () => {
    const text = detailOf(renderWith(unknownId, inThreeDays))
    expect(text).toContain("today.campaignEvent.unnamedWithTime")
    expect(text).toContain("in 3 days")
    expect(text).not.toContain(unknownId)
  })

  it("reports an unresolvable event with no calendar window as active but untimed", () => {
    expect(detailOf(renderWith(unknownId, null))).toBe(
      "today.campaignEvent.unnamed"
    )
  })

  it("states no event is active when none is detected, even while the calendar shows one — matching the schedule, which drops every event node in that state", () => {
    expect(detailOf(renderWith(null, inThreeDays))).toBe(
      "today.campaignEvent.inactive"
    )

    const battles = [
      {
        id: "standing",
        campaignGroupId: "campaign1",
        type: "Standard",
        challenge: false,
        nodeNumber: 1,
      },
      {
        id: "event",
        campaignGroupId: knownId,
        type: "Standard",
        challenge: false,
        nodeNumber: 1,
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
})
