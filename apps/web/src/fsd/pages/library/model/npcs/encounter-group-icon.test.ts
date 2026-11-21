import { describe, expect, it } from "vitest"

import { encounterGroupIcon } from "./encounter-group-icon"

const row = (
  source: Parameters<typeof encounterGroupIcon>[0]["source"],
  groupId: string,
  track: string | null = null
) =>
  ({
    source,
    groupId,
    battles: track === null ? [] : [{ track }],
  }) as unknown as Parameters<typeof encounterGroupIcon>[0]

describe("encounterGroupIcon", () => {
  it("uses the campaign's own icon, by its track for an event", () => {
    expect(encounterGroupIcon(row("campaign", "elite1"))).toContain(
      "ui_icon_campaign_01_elite"
    )
    expect(
      encounterGroupIcon(row("campaignEvent", "eventCampaign7", "Extremis"))
    ).toContain("eventExtremis")
  })

  it("uses the event hero's and the Machine of War's portraits", () => {
    expect(
      encounterGroupIcon(row("legendaryEvent", "ultraTigurius"))
    ).toContain("RoundPortrait_ultra_tigurius")
    expect(encounterGroupIcon(row("incursion", "tauRazorshark"))).toBeDefined()
  })

  it("uses the Onslaught token, and nothing for Survival", () => {
    expect(encounterGroupIcon(row("onslaught", "onslaught"))).toContain(
      "Onslaught"
    )
    expect(
      encounterGroupIcon(row("survival", "survival_crescendo_01"))
    ).toBeUndefined()
  })
})
