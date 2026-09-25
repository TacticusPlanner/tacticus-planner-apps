import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import {
  GoalProgressDisplay,
  GoalProgressLegend,
  GoalTargetDisplay,
} from "./goal-progress-visuals"

describe("GoalProgressDisplay", () => {
  it("never shows 100% unless the ratio has truly reached 1, even when rounding would otherwise round up", () => {
    render(
      <GoalProgressDisplay
        progress={
          { kind: "Unlock", owned: 498, required: 500, ratio: 0.996 } as never
        }
      />
    )
    expect(screen.getByText("99%")).toBeInTheDocument()
    expect(screen.queryByText("100%")).toBeNull()
  })

  it("shows 100% once the ratio has truly reached 1", () => {
    render(
      <GoalProgressDisplay
        progress={
          { kind: "Unlock", owned: 500, required: 500, ratio: 1 } as never
        }
      />
    )
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("renders only the solid fill for an actual-only ratio, with no potential striping", () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.55,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(screen.getByTestId("goal-progress-bar")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-progress-bar-potential-fill")).toBeNull()
  })

  it("shows a striped potential fill and the ↗ indicator when potential exceeds actual", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.47}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(
      screen.getByTestId("goal-progress-bar-potential-fill")
    ).toBeInTheDocument()
    expect(screen.getByText(/potentialIndicator/)).toBeInTheDocument()
  })

  it("shows only the solid fill when potential is at or below actual", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.6}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.6,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(screen.queryByTestId("goal-progress-bar-potential-fill")).toBeNull()
  })

  it("shows only the striped fill when actual is 0 and potential is above 0", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.82}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Stone1",
            ratio: 0,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(
      screen.getByTestId("goal-progress-bar-potential-fill")
    ).toBeInTheDocument()
  })

  it("renders no info trigger, popover, or expand affordance when only Actual Progress applies", () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(screen.getByTestId("goal-progress-bar")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-progress-info-trigger")).toBeNull()
    expect(screen.queryByTestId("goal-progress-mobile-footer")).toBeNull()
  })

  it("opens the popover on click and closes on a second click (desktop)", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.47}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
          } as never
        }
      />
    )

    const trigger = screen.getByTestId("goal-progress-info-trigger")
    expect(screen.queryByTestId("goal-progress-explanation")).toBeNull()
    fireEvent.click(trigger)
    expect(screen.getByTestId("goal-progress-explanation")).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.queryByTestId("goal-progress-explanation")).toBeNull()
  })

  it("shows levels/xp remaining in the explanation popover for a Level goal with a potential ratio", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.8}
        progress={
          {
            kind: "Level",
            current: 44,
            target: 50,
            ratio: 0.5,
            reachableRatio: null,
            reachableLevel: null,
            remainingXp: 12_674,
          } as never
        }
      />
    )

    const trigger = screen.getByTestId("goal-progress-info-trigger")
    fireEvent.click(trigger)
    const explanation = screen.getByTestId("goal-progress-explanation")
    expect(explanation).toHaveTextContent(
      "goals.overview.actualLevelsRemaining"
    )
    expect(explanation).toHaveTextContent('"count":"6"')
    expect(explanation).toHaveTextContent("goals.overview.potentialXpRemaining")
    expect(explanation).toHaveTextContent('"xp":"12,674"')
  })

  it("renders a ceiling marker naming the reachable rank, for a Rank goal with a currently-reachable ratio", async () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Diamond1",
            ratio: 0.25,
            reachableRatio: 0.6,
            reachableRank: "Silver1",
            reachableRankLimitedBy: "rarity",
          } as never
        }
      />
    )

    const marker = screen.getByTestId("goal-progress-bar-ceiling")
    expect(marker).toBeInTheDocument()
    await userEvent.hover(marker)
    const tooltip = await screen.findByTestId(
      "goal-progress-bar-ceiling-tooltip"
    )
    expect(tooltip).toHaveTextContent("reachableCeilingLabel")
    expect(tooltip).toHaveTextContent("ranks.Silver1")
    expect(tooltip).toHaveTextContent("reachableCeilingReasonRarity")
  })

  it("renders a ceiling marker naming the reachable level, for a Level goal with a currently-reachable ratio", async () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "Level",
            current: 15,
            target: 50,
            ratio: 0.1,
            reachableRatio: 0.4,
            reachableLevel: 26,
          } as never
        }
      />
    )

    const marker = screen.getByTestId("goal-progress-bar-ceiling")
    expect(marker).toBeInTheDocument()
    await userEvent.hover(marker)
    const tooltip = await screen.findByTestId(
      "goal-progress-bar-ceiling-tooltip"
    )
    expect(tooltip).toHaveTextContent(
      'goals.overview.reachableCeilingLevelLabel:{"level":26}'
    )
    expect(tooltip).toHaveTextContent("reachableCeilingReasonRarity")
  })

  it("renders no ceiling marker when the goal is not currently restricted", () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
          } as never
        }
      />
    )

    expect(screen.queryByTestId("goal-progress-bar-ceiling")).toBeNull()
  })

  it("renders no ceiling marker for goal kinds without a reachable ceiling", () => {
    render(
      <GoalProgressDisplay
        progress={
          { kind: "Unlock", owned: 250, required: 500, ratio: 0.5 } as never
        }
      />
    )

    expect(screen.queryByTestId("goal-progress-bar-ceiling")).toBeNull()
  })

  it("expands the explanation inline on tap and collapses on a second tap (mobile)", () => {
    useIsMobileMock.mockReturnValue(true)
    render(
      <GoalProgressDisplay
        potentialRatio={0.47}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
          } as never
        }
        remaining={{
          upgrades: [],
          shardId: null,
          shards: 0,
          mythicShards: 0,
          orbsByType: {},
          upgradeSlotsRemaining: 9,
        }}
      />
    )

    const footer = screen.getByTestId("goal-progress-mobile-footer")
    expect(screen.queryByTestId("goal-progress-mobile-explanation")).toBeNull()
    fireEvent.click(footer)
    expect(
      screen.getByTestId("goal-progress-mobile-explanation")
    ).toBeInTheDocument()
    fireEvent.click(footer)
    expect(screen.queryByTestId("goal-progress-mobile-explanation")).toBeNull()
    useIsMobileMock.mockReturnValue(false)
  })
})

describe("GoalProgressLegend", () => {
  it("renders nothing when show is false", () => {
    render(<GoalProgressLegend show={false} />)
    expect(screen.queryByTestId("goal-progress-legend")).toBeNull()
  })

  it("renders once when show is true", () => {
    render(<GoalProgressLegend show={true} />)
    expect(screen.getByTestId("goal-progress-legend")).toBeInTheDocument()
  })
})

describe("GoalTargetDisplay for Rank milestones", () => {
  const rank = (target: string, targetSlots: number) =>
    ({
      kind: "Rank",
      current: "Silver2",
      target,
      targetSlots,
      ratio: 0.4,
      reachableRatio: null,
    }) as never

  it("labels each milestone's own target so two goals for one character read apart", () => {
    const { unmount } = render(
      <GoalTargetDisplay progress={rank("Silver3", 0)} />
    )
    expect(screen.getByText(/ranks\.Silver3/)).toBeInTheDocument()
    unmount()

    render(<GoalTargetDisplay progress={rank("Gold1", 0)} />)
    expect(screen.getByText(/ranks\.Gold1/)).toBeInTheDocument()
    expect(screen.queryByText(/ranks\.Silver3/)).not.toBeInTheDocument()
  })

  it("adds the applied slots for a partial target and nothing for a clean one", () => {
    const { unmount } = render(
      <GoalTargetDisplay progress={rank("Gold1", 3)} />
    )
    expect(screen.getByText("(3/6)")).toBeInTheDocument()
    unmount()

    render(<GoalTargetDisplay progress={rank("Gold1", 0)} />)
    expect(screen.queryByText(/\/6\)/)).not.toBeInTheDocument()
  })
})
