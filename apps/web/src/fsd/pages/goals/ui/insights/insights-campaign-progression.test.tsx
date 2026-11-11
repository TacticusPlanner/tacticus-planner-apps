import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"
import type { CampaignId } from "@workspace/game-domain"

import type { EstimateResourceId } from "@/features/goal-farming"

import { InsightsCampaignProgression } from "./insights-campaign-progression"

describe("InsightsCampaignProgression", () => {
  it("lists each campaign with battles left, what it unblocks, energy saved and why it's locked", () => {
    render(
      <InsightsCampaignProgression
        campaigns={[
          {
            key: "elite2:Elite",
            campaignGroupId: "elite2" as CampaignId,
            type: "Elite",
            battlesLeft: 40,
            started: false,
            energySaved: 1250,
            unblocks: [
              {
                resourceId: "matB" as EstimateResourceId,
                label: "Material B",
                count: 4,
                battlesToGo: 8,
                goalIds: ["g2"],
              },
            ],
            lockReasons: [
              {
                kind: "RequiredCampaignNotCleared",
                campaignGroupId: "campaign2" as CampaignId,
                type: "Standard",
                battlesLeft: 12,
              },
              { kind: "PowerLevelTooLow", required: 25, current: 18 },
            ],
          },
        ]}
      />
    )

    const campaign = within(
      screen.getByRole("list", { name: "Campaigns to push" })
    ).getByTestId("insights-campaign-progression")
    expect(campaign).toHaveTextContent("Fall of Cadia Elite")
    expect(campaign).toHaveTextContent("Not started, 40 battles")
    expect(campaign).toHaveTextContent("Unblocks Material B in 8 battles")
    expect(campaign).toHaveTextContent("Saves about 1,250")
    expect(campaign).toHaveTextContent(
      "Clear Fall of Cadia Standard first (12 battles left)"
    )
    expect(campaign).toHaveTextContent("Reach Power Level 25 (you're at 18)")
  })

  it("renders nothing without campaigns to push", () => {
    render(<InsightsCampaignProgression campaigns={[]} />)
    expect(
      screen.queryByRole("list", { name: "Campaigns to push" })
    ).not.toBeInTheDocument()
  })
})
