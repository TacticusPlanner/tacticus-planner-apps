import { describe, expect, it } from "vitest"

import { campaignDescriptor } from "./campaign"

describe("campaignDescriptor", () => {
  it("describes storyline groups with a standard/elite token, keyed by the storyline name", () => {
    expect(campaignDescriptor("campaign1", "Standard")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("elite1", "Elite")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "elite",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("campaign2", "Standard")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
  })

  it("flags isMirror for the mirror/eliteMirror groups, keyed by the same storyline name", () => {
    expect(campaignDescriptor("mirror1", "Mirror")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("eliteMirror2", "EliteMirror")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "elite",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
  })

  it("describes event campaigns by groupId, with a per-type token and challenge flag", () => {
    expect(campaignDescriptor("eventCampaign1", "Standard")).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventStandard",
      isMirror: false,
      isEvent: true,
      challenge: false,
    })
    // The `challenge` flag is now a separate battle-level field (not folded into the type
    // string); the caller uses it to append "B" to node numbers, and both tiers reuse the base
    // Standard/Extremis asset.
    expect(campaignDescriptor("eventCampaign1", "Extremis", true)).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventExtremis",
      isMirror: false,
      isEvent: true,
      challenge: true,
    })
  })

  it("returns undefined for an unrecognized group or type", () => {
    expect(campaignDescriptor("unknown-group", "Standard")).toBeUndefined()
    expect(campaignDescriptor("eventCampaign1", "Unknown")).toBeUndefined()
    expect(campaignDescriptor("campaign5", "Standard")).toBeUndefined()
  })
})
