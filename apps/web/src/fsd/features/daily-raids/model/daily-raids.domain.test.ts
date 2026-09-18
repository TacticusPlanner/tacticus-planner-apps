import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { BattleId } from "@workspace/game-domain"
import type { CampaignDescriptor } from "@workspace/game-catalog"

const words: Record<string, string> = {
  "campaigns:difficulties.standard": "Standard",
  "campaigns:difficulties.elite": "Elite",
  "campaigns:difficulties.mirror": "Mirror",
  "campaigns:difficulties.eventStandard": "Standard",
  "campaigns:difficulties.eventExtremis": "Extremis",
  "campaigns:names.fall-of-cadia": "Fall of Cadia",
  "campaigns:names.indomitus": "Indomitus",
  "campaigns:names.saim-hann": "Saim-Hann",
  "campaigns:names.adepta-sororitas-vs-death-guard": "Death Guard",
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      words[key] ?? opts?.defaultValue ?? key,
  }),
}))

import { useCampaignDisplay } from "@/shared/lib"

import { campaignLocationLabels } from "./daily-raids.domain"

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
  it("puts the bare campaign name on the first line and the tier + node on the second", () => {
    expect(
      labels(
        descriptor({ nameKey: "fall-of-cadia", difficultyToken: "elite" }),
        40
      )
    ).toEqual({ campaignName: "Fall of Cadia", nodeLabel: "Elite 40" })
  })

  it("keeps every tier of one storyline on an identical first line", () => {
    const standard = labels(descriptor({}), 22)
    const mirror = labels(descriptor({ isMirror: true }), 12)
    expect(standard.campaignName).toBe("Indomitus")
    expect(mirror.campaignName).toBe("Indomitus")
    expect(standard.nodeLabel).toBe("Standard 22")
    expect(mirror.nodeLabel).toBe("Mirror 12")
  })

  it("retains both qualifiers for a mirror elite node", () => {
    expect(
      labels(
        descriptor({
          nameKey: "saim-hann",
          isMirror: true,
          difficultyToken: "elite",
        }),
        40
      ).nodeLabel
    ).toBe("Mirror Elite 40")
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
