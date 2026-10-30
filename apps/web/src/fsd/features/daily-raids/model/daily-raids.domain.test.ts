import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"
import type { CampaignDescriptor } from "@workspace/game-catalog"

import { renderHook } from "@/test/render"
import { useCampaignDisplay } from "@/shared/lib"

import { campaignLocationLabels } from "./daily-raids.domain"

// Real English copy: campaigns.json supplies the names and difficulty tiers.
function descriptor(
  overrides: Partial<CampaignDescriptor>
): CampaignDescriptor {
  return {
    nameKey: "indomitus",
    difficultyToken: "standard",
    isMirror: false,
    isEvent: false,
    challenge: false,
    ...overrides,
  }
}

function labels(
  d: CampaignDescriptor | undefined,
  nodeNumber: number,
  challenge = false,
  battleId = "B1" as BattleId
) {
  const { result } = renderHook(() => useCampaignDisplay())
  return campaignLocationLabels(
    battleId,
    { nodeNumber, challenge },
    d,
    result.current
  )
}

describe("campaignLocationLabels", () => {
  it("puts the campaign name on the first line and the difficulty + node on the second", () => {
    expect(
      labels(
        descriptor({ nameKey: "fall-of-cadia", difficultyToken: "elite" }),
        40
      )
    ).toEqual({ campaignName: "Fall of Cadia", nodeLabel: "Elite 40" })
  })

  it("names a mirror campaign apart from its base storyline on the first line", () => {
    const standard = labels(descriptor({}), 22)
    const mirror = labels(descriptor({ isMirror: true }), 12)
    expect(standard).toEqual({
      campaignName: "Indomitus",
      nodeLabel: "Standard 22",
    })
    expect(mirror).toEqual({
      campaignName: "Indomitus Mirror",
      nodeLabel: "Standard 12",
    })
  })

  it("keeps Mirror in the name and Elite on the node line for a mirror elite node", () => {
    expect(
      labels(
        descriptor({
          nameKey: "saim-hann",
          isMirror: true,
          difficultyToken: "elite",
        }),
        40
      )
    ).toEqual({ campaignName: "Saim-Hann Mirror", nodeLabel: "Elite 40" })
  })

  it("shows an event node's own tier", () => {
    expect(
      labels(
        descriptor({
          nameKey: "adepta-sororitas-vs-death-guard",
          isEvent: true,
          difficultyToken: "eventExtremis",
        }),
        3
      )
    ).toEqual({ campaignName: "Death Guard", nodeLabel: "Extremis 3" })
  })

  it("suffixes a challenge node with B", () => {
    expect(
      labels(
        descriptor({
          nameKey: "adepta-sororitas-vs-death-guard",
          isEvent: true,
          difficultyToken: "eventExtremis",
          challenge: true,
        }),
        12,
        true
      ).nodeLabel
    ).toBe("Extremis 12B")
  })

  it("falls back to the raw battle id with no second line when the catalog has no descriptor", () => {
    expect(labels(undefined, 12, false, "AME12" as BattleId)).toEqual({
      campaignName: "AME12",
      nodeLabel: "",
    })
  })
})
