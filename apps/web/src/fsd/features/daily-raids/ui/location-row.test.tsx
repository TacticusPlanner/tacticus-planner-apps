import { describe, expect, it } from "vitest"
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
      const line = screen.getByText(label)
      expect(line).toHaveClass("break-words")
      expect(line).not.toHaveClass("truncate")
    }
  })
})
