import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { GoalDetailView } from "./goal-detail-view"

describe("GoalDetailView", () => {
  it("explains project potential progress and separates actual slots from farming energy", () => {
    render(
      <GoalDetailView
        assignedProjects={[]}
        blockers={{ isBlocked: false, reasons: [] }}
        dependencies={[]}
        detail={{ events: [], goalType: "Rank", notes: null } as never}
        estimate={{
          days: 5,
          date: "2026-01-06",
          energyTotal: 50,
          raidsTotal: 5,
        }}
        farmingSummary={null}
        getEntityName={() => "Hero"}
        isolated={false}
        onCreatePrerequisite={vi.fn()}
        onViewGoal={vi.fn()}
        potentialRatio={0.75}
        progress={{
          kind: "Rank",
          current: "Stone1",
          target: "Iron1",
          ratio: 0.25,
        }}
        remaining={{
          upgrades: [],
          shardId: null,
          shards: 0,
          mythicShards: 0,
          orbsByType: {},
          upgradeSlotsRemaining: 3,
        }}
      />
    )

    expect(screen.getByTestId("goal-remaining-summary")).toHaveTextContent(
      "goals.overview.remaining.upgradeSlots"
    )
    expect(
      screen.getByTestId("goal-energy-remaining-summary")
    ).toHaveTextContent("goals.overview.remaining.energy")
    expect(
      screen.getByText("goals.detail.potentialProgressDescription")
    ).toBeInTheDocument()
  })
})
