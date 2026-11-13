import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import { LocationRow } from "./location-row"

const battleId = battleIdSchema.parse("B1")

describe("LocationRow", () => {
  it("names just the battle, wrapping a long localized node label in full instead of truncating it", () => {
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
          materialNeed: 4,
          dropRate: 0.5,
        }}
        location={{
          id: battleId,
          campaignName,
          nodeLabel,
          difficultyLabel: "Extremis",
          shortLabel: "AdMech EX 12B",
          challenge: true,
        }}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    // The campaign and tier are the group header's; the row names the battle.
    const line = screen
      .getByText("Battle 12B (Herausforderungsknoten)")
      .closest(".wrap-break-word")
    expect(line).not.toBeNull()
    expect(line).not.toHaveClass("truncate")
    expect(screen.queryByText(campaignName)).not.toBeInTheDocument()
  })

  it("names the location in full when the catalog has no node for it", () => {
    render(
      <LocationRow
        entry={{
          battleId,
          resourceId: "upgrade-1",
          raidsToPerform: 3,
          dailyAttempts: 5,
          remainingBefore: 4,
          materialNeed: 4,
          dropRate: 0.5,
        }}
        location={{
          id: battleId,
          campaignName: "B1",
          nodeLabel: "",
          shortLabel: "B1",
          challenge: false,
        }}
        resourceLabel="Upgrade"
        resourceVisual={undefined}
      />
    )

    expect(
      screen.getByTestId(`home-raid-location-${battleId}`)
    ).toHaveTextContent("B1")
    expect(screen.queryByText(/Battle/)).not.toBeInTheDocument()
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
          materialNeed: 4,
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

    const button = screen.getByRole("button", { name: /Battle 36/ })
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
          materialNeed: 4,
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
