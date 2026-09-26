import { fireEvent, render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { resolvedLanguage: "en" },
  }),
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
          targetSlots: 0,
          ratio: 0.25,
          reachableRatio: null,
          reachableRank: null,
          reachableAppliedSlots: null,
          reachableRankLimitedBy: null,
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

    fireEvent.click(screen.getByTestId("goal-progress-info-trigger"))

    const explanation = screen.getByTestId("goal-progress-explanation")
    expect(explanation).toHaveTextContent("goals.overview.actualProgress 25%")
    expect(explanation).toHaveTextContent(
      "goals.overview.actualProgressDescription"
    )
    expect(explanation).toHaveTextContent(
      'goals.overview.actualSlotsRemaining:{"count":"3"}'
    )
    expect(explanation).toHaveTextContent(
      "goals.overview.potentialProgress 75%"
    )
    expect(explanation).toHaveTextContent(
      "goals.overview.potentialProgressDescription"
    )
    expect(explanation).toHaveTextContent(
      'goals.overview.potentialEnergyRemaining:{"energy":"50"}'
    )
  })

  it("renders the missing-Unlock reason's create action (4.2)", () => {
    const onCreatePrerequisite = vi.fn()

    render(
      <GoalDetailView
        assignedProjects={[]}
        blockers={{
          isBlocked: true,
          reasons: [
            {
              kind: "MissingUnlockPrerequisite",
              unitName: "Bellator",
              existingGoalId: undefined,
            },
          ],
        }}
        dependencies={[]}
        detail={{ events: [], goalType: "Rank", notes: null } as never}
        estimate={undefined}
        farmingSummary={null}
        getEntityName={() => "Hero"}
        isolated={false}
        onCreatePrerequisite={onCreatePrerequisite}
        onViewGoal={vi.fn()}
        progress={{ kind: "Unknown" }}
        remaining={null}
      />
    )

    const button = screen.getByRole("button", {
      name: "goals.blocked.createPrerequisite",
    })
    fireEvent.click(button)

    expect(onCreatePrerequisite).toHaveBeenCalledWith({
      kind: "MissingUnlockPrerequisite",
      unitName: "Bellator",
      existingGoalId: undefined,
    })
    expect(
      screen.queryByText("goals.blocked.existingPrerequisiteGuidance")
    ).not.toBeInTheDocument()
  })
})
