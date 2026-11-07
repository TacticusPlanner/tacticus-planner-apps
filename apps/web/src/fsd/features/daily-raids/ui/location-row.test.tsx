import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import { LocationRow } from "./location-row"

const battleId = battleIdSchema.parse("B1")

describe("LocationRow", () => {
  it("wraps a long localized campaign name and node label in full instead of truncating them", () => {
    const campaignName = "Adeptus Mechanicus – Kampagnenereignis"
    const nodeLabel = "Extremis 12B (Herausforderungsknoten)"
    render(
      <LocationRow
        entry={{
          battleId,
          resourceId: "upgrade-1",
          raidsToPerform: 3,
          dailyAttempts: 5,
          remainingBefore: 4,
          dropRate: 0.5,
        }}
        location={{
          id: battleId,
          campaignName,
          nodeLabel,
          shortLabel: "AdMech EX 12B",
          challenge: true,
        }}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    for (const label of [campaignName, nodeLabel]) {
      // Campaign, tier and node share one line that wraps instead of truncating.
      const line = screen.getByText(label).closest(".break-words")
      expect(line).not.toBeNull()
      expect(line).not.toHaveClass("truncate")
      expect(line).toHaveTextContent(`${campaignName} ${nodeLabel}`)
    }
  })

  it("sets the difficulty word in italics on the same line as the campaign and node", () => {
    render(
      <LocationRow
        entry={{
          battleId,
          resourceId: "upgrade-1",
          raidsToPerform: 3,
          dailyAttempts: 5,
          remainingBefore: 4,
          dropRate: 0.5,
        }}
        location={{
          id: battleId,
          campaignName: "Indomitus Mirror",
          nodeLabel: "Elite 36",
          difficultyLabel: "Elite",
          shortLabel: "IM E 36",
          challenge: false,
        }}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    const tier = screen.getByText("Elite")
    expect(tier.tagName).toBe("EM")
    expect(tier.closest(".break-words")).toHaveTextContent(
      "Indomitus Mirror Elite 36"
    )
  })

  it("opens the location's battle from its name when it can show one", async () => {
    const user = userEvent.setup()
    const onShowLocation = vi.fn()
    render(
      <LocationRow
        entry={{
          battleId,
          resourceId: "upgrade-1",
          raidsToPerform: 3,
          dailyAttempts: 5,
          remainingBefore: 4,
          dropRate: 0.5,
        }}
        location={{
          id: battleId,
          campaignName: "Indomitus Mirror",
          nodeLabel: "Elite 36",
          difficultyLabel: "Elite",
          shortLabel: "IM E 36",
          challenge: false,
        }}
        onShowLocation={onShowLocation}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    const button = screen.getByRole("button", { name: /Indomitus Mirror/ })
    expect(button).toHaveAttribute("aria-haspopup", "dialog")
    await user.click(button)
    expect(onShowLocation).toHaveBeenCalledWith({
      battleId,
      title: {
        campaignName: "Indomitus Mirror",
        difficultyLabel: "Elite",
        nodeLabel: "Elite 36",
      },
    })
  })

  it("keeps the name plain text without a way to show the battle", () => {
    render(
      <LocationRow
        entry={{
          battleId,
          resourceId: "upgrade-1",
          raidsToPerform: 3,
          dailyAttempts: 5,
          remainingBefore: 4,
          dropRate: 0.5,
        }}
        location={undefined}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    expect(
      screen.queryByTestId(`raid-location-details-${battleId}`)
    ).not.toBeInTheDocument()
  })
})
