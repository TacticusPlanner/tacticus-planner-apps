import { fireEvent, render, screen } from "@/test/render"
import { MemoryRouter } from "react-router"
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
        battlesById={new Map()}
        blockers={{ isBlocked: false, reasons: [] }}
        charactersById={new Map()}
        dailyEnergy={288}
        dependencies={[]}
        detail={
          { events: [], goalType: "Rank", notes: null, config: {} } as never
        }
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
        upgradesById={new Map()}
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
        battlesById={new Map()}
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
        charactersById={new Map()}
        dailyEnergy={288}
        dependencies={[]}
        detail={
          { events: [], goalType: "Rank", notes: null, config: {} } as never
        }
        estimate={undefined}
        farmingSummary={null}
        getEntityName={() => "Hero"}
        isolated={false}
        onCreatePrerequisite={onCreatePrerequisite}
        onViewGoal={vi.fn()}
        progress={{ kind: "Unknown" }}
        remaining={null}
        upgradesById={new Map()}
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

  it("says a Rank goal's milestone is covered by an earlier goal instead of a resource breakdown", () => {
    render(
      <GoalDetailView
        assignedProjects={[]}
        battlesById={new Map()}
        blockers={{ isBlocked: false, reasons: [] }}
        charactersById={new Map()}
        dailyEnergy={288}
        dependencies={[]}
        detail={
          { events: [], goalType: "Rank", notes: null, config: {} } as never
        }
        estimate={undefined}
        farmingSummary={null}
        getEntityName={() => "Hero"}
        isolated={false}
        onCreatePrerequisite={vi.fn()}
        onViewGoal={vi.fn()}
        progress={{ kind: "Unknown" }}
        remaining={{
          upgrades: [{ id: "mat-1" as never, count: 5 }],
          shardId: null,
          shards: 0,
          mythicShards: 0,
          orbsByType: {},
          upgradeSlotsRemaining: 0,
          coveredByEarlierGoal: true,
        }}
        upgradesById={new Map()}
      />
    )

    expect(
      screen.getByTestId("goal-detail-farming-guidance-covered")
    ).toHaveTextContent("goals.detail.farmingGuidanceCovered")
    expect(
      screen.queryByTestId("goal-detail-farming-guidance")
    ).not.toBeInTheDocument()
  })

  it("shows eligible and unavailable farming guidance for outstanding materials", () => {
    const upgradesById = new Map([
      [
        "mat-eligible" as never,
        {
          id: "mat-eligible",
          farmLocations: [
            {
              battleId: "b1",
              guaranteed: true,
              effectiveRate: null,
              numerator: null,
              denominator: null,
              isMythic: false,
            },
          ],
        },
      ],
      ["mat-locked" as never, { id: "mat-locked", farmLocations: [] }],
    ]) as never
    const battlesById = new Map([
      [
        "b1" as never,
        {
          campaignGroupId: "c1",
          type: "Normal",
          challenge: false,
          nodeNumber: 1,
          battleIndex: 0,
          energyCost: 6,
          dailyAttempts: 10,
        },
      ],
    ]) as never

    render(
      <MemoryRouter>
        <GoalDetailView
          assignedProjects={[]}
          battlesById={battlesById}
          blockers={{ isBlocked: false, reasons: [] }}
          charactersById={new Map()}
          dailyEnergy={288}
          dependencies={[]}
          detail={
            { events: [], goalType: "Rank", notes: null, config: {} } as never
          }
          estimate={undefined}
          farmingSummary={null}
          getEntityName={() => "Hero"}
          isolated={false}
          onCreatePrerequisite={vi.fn()}
          onViewGoal={vi.fn()}
          progress={{ kind: "Unknown" }}
          remaining={{
            upgrades: [
              { id: "mat-eligible" as never, count: 3 },
              { id: "mat-locked" as never, count: 2 },
            ],
            shardId: null,
            shards: 0,
            mythicShards: 0,
            orbsByType: {},
            upgradeSlotsRemaining: null,
          }}
          upgradesById={upgradesById}
        />
      </MemoryRouter>
    )

    const rows = screen.getAllByTestId("goal-detail-farming-guidance-row")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(
      'goals.detail.farmingGuidanceEligible:{"count":1}'
    )
    expect(rows[1]).toHaveTextContent("goals.estimate.blocked.NoFarmLocation")
    expect(
      screen.getByTestId("goal-detail-farming-guidance-link")
    ).toBeInTheDocument()
  })
})
