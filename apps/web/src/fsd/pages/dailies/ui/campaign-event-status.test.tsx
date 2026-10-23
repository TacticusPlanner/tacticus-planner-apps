import { describe, expect, it } from "vitest"
import { campaignIdSchema } from "@workspace/game-domain"

import { refreshLocalDataAfterSync } from "@/shared/local-data"
import { act, render, screen, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"
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

/** Seeds the synced event id and the catalog's campaign-event window (open since yesterday). */
async function seedCampaignEvent(
  activeCampaignEventId: typeof knownId | null,
  campaignEventWindow: CampaignEventWindow | null
) {
  await seedPlayerData({
    "live-progress": { battleAttempts: [], activeCampaignEventId },
  })
  await seedGameCatalog({
    "events-calendar": {
      "2026-01-01": campaignEventWindow
        ? [
            {
              definitionId: "campaign-event",
              startUtc: new Date(Date.now() - 86_400_000).toISOString(),
              ...campaignEventWindow,
            },
          ]
        : [],
    },
  })
}

describe("CampaignEventStatusLine", () => {
  // Returns once the local reads have settled, so a negative assertion never passes on the
  // still-loading (inactive) first render.
  async function renderWith(
    activeCampaignEventId: typeof knownId | null,
    campaignEventWindow: CampaignEventWindow | null
  ) {
    await seedCampaignEvent(activeCampaignEventId, campaignEventWindow)
    render(<CampaignEventStatusLine />)
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    return screen.getByTestId("campaign-event-status")
  }

  const detailOf = (element: HTMLElement) =>
    element.lastElementChild?.textContent ?? ""

  it("heads the block with the campaign-event label at the schedule's own heading weight", async () => {
    const heading = (await renderWith(knownId, confirmedWindow)).querySelector(
      "h2"
    )
    expect(heading?.textContent).toBe("Campaign event")
    expect(heading).toHaveClass("text-lg", "font-semibold")
  })

  it("shows the detected event's campaign icon", async () => {
    const image = (await renderWith(knownId, confirmedWindow)).querySelector(
      "img"
    )
    expect(image?.getAttribute("src")).toContain(
      "adepta-sororitas-vs-death-guard"
    )
  })

  it("carries no icon when no event is detected", async () => {
    expect(
      (await renderWith(null, confirmedWindow)).querySelector("img")
    ).toBeNull()
  })

  it("names the detected event and its remaining time for a confirmed window", async () => {
    const text = detailOf(await renderWith(knownId, confirmedWindow))
    expect(text).toContain(" · ends ")
    // The localized campaign name: "adepta-sororitas-vs-death-guard" reads "Death Guard".
    expect(text).toContain("Death Guard")
    expect(text).toContain("in 3 days")
  })

  it("names the detected event and states its end time is unconfirmed, without a numeric countdown", async () => {
    const text = detailOf(await renderWith(knownId, unconfirmedWindow))
    expect(text).toContain("end time not confirmed")
    expect(text).toContain("Death Guard")
    expect(text).not.toContain("in 3 days")
    expect(text).not.toContain(" · ends ")
  })

  it("names the detected event without a time when the calendar has no active window", async () => {
    const text = detailOf(await renderWith(knownId, null))
    expect(text).toContain("Death Guard")
    expect(text).not.toContain(" · ends ")
    expect(text).not.toContain("end time not confirmed")
  })

  it("reports an unresolvable event as active without ever showing its raw group id", async () => {
    const text = detailOf(await renderWith(unknownId, confirmedWindow))
    expect(text).toContain("Active · name unavailable · ends ")
    expect(text).toContain("in 3 days")
    expect(text).not.toContain(unknownId)
  })

  it("reports an unresolvable event with an unconfirmed window as active and unconfirmed, untimed", async () => {
    const text = detailOf(await renderWith(unknownId, unconfirmedWindow))
    expect(text).toContain("Active · name unavailable · end time not confirmed")
    expect(text).not.toContain("in 3 days")
    expect(text).not.toContain(unknownId)
  })

  it("reports an unresolvable event with no calendar window as active but untimed", async () => {
    expect(detailOf(await renderWith(unknownId, null))).toBe(
      "Active · name unavailable"
    )
  })

  it("states no event is active when none is detected, even while the calendar shows one — matching the schedule, which drops every event node in that state", async () => {
    expect(detailOf(await renderWith(null, confirmedWindow))).toBe("Not active")

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
  it("switches from unconfirmed text to a confirmed countdown when the catalog refreshes to an authored occurrence", async () => {
    await seedCampaignEvent(knownId, unconfirmedWindow)
    const { queryClient } = render(<CampaignEventStatusLine />)
    const status = screen.getByTestId("campaign-event-status")
    await waitFor(() =>
      expect(detailOf(status)).toContain("end time not confirmed")
    )
    const before = detailOf(status)
    expect(before).toContain("Death Guard")
    expect(before).not.toContain("in 3 days")

    // A catalog sync replaces the projected placeholder with the authored occurrence.
    await seedCampaignEvent(knownId, confirmedWindow)
    refreshLocalDataAfterSync(queryClient, "catalog", ["events-calendar"])
    await waitFor(() => expect(detailOf(status)).toContain(" · ends "))
    const after = detailOf(status)
    expect(after).toContain("in 3 days")
    expect(after).not.toContain("end time not confirmed")
  })
})
