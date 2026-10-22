import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import { GoalProgressDisplay, GoalTargetDisplay } from "./goal-progress-visuals"

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
    expect(screen.getByText("↗ 47%")).toBeInTheDocument()
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

  it("shows levels/xp remaining in the explanation popover for a level requirement with a potential ratio", () => {
    render(
      <GoalProgressDisplay
        potentialRatio={0.8}
        progress={
          {
            kind: "LevelRequirement",
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
    expect(explanation).toHaveTextContent("6 levels remaining.")
    expect(explanation).toHaveTextContent("12,674 XP remaining.")
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
    expect(tooltip).toHaveTextContent("Currently reachable:")
    expect(tooltip).toHaveTextContent("Silver I")
    expect(tooltip).toHaveTextContent("capped by rarity")
  })

  it("renders a ceiling marker naming the reachable level, for a level requirement with a currently-reachable ratio", async () => {
    render(
      <GoalProgressDisplay
        progress={
          {
            kind: "LevelRequirement",
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
    expect(tooltip).toHaveTextContent("Currently reachable: Level 26")
    expect(tooltip).toHaveTextContent("capped by rarity")
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

  it("shows emblems only, each carrying its rank name as accessible name, so milestones still read apart", () => {
    const { unmount } = render(
      <GoalTargetDisplay progress={rank("Silver3", 0)} />
    )
    expect(screen.getByAltText("Silver III")).toBeInTheDocument()
    expect(screen.getByAltText("Silver II")).toBeInTheDocument()
    expect(screen.queryByText(/Silver I/)).not.toBeInTheDocument()
    unmount()

    render(<GoalTargetDisplay progress={rank("Gold1", 0)} />)
    expect(screen.getByAltText("Gold I")).toBeInTheDocument()
    expect(screen.queryByAltText("Silver III")).not.toBeInTheDocument()
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

describe("GoalTargetDisplay for Ability goals", () => {
  const ability = (
    currentActive: number,
    targetActive: number,
    currentPassive: number,
    targetPassive: number
  ) =>
    ({
      kind: "Ability",
      currentActive,
      targetActive,
      currentPassive,
      targetPassive,
      ratio: 0.2,
    }) as never
  const pill = (key: string) => screen.queryByTestId(`goal-ability-pill-${key}`)

  it("labels a Machine of War's tracks Primary and Secondary, one pill each", () => {
    render(
      <GoalTargetDisplay entityType="Mow" progress={ability(47, 50, 12, 15)} />
    )
    expect(pill("primary")).toHaveTextContent("Primary4750")
    expect(pill("secondary")).toHaveTextContent("Secondary1215")
    expect(pill("active")).toBeNull()
    expect(pill("passive")).toBeNull()
  })

  it("labels a Character's tracks Active and Passive", () => {
    render(
      <GoalTargetDisplay
        entityType="Character"
        progress={ability(8, 10, 5, 7)}
      />
    )
    expect(pill("active")).toHaveTextContent("Active810")
    expect(pill("passive")).toHaveTextContent("Passive57")
    expect(pill("primary")).toBeNull()
    expect(pill("secondary")).toBeNull()
  })

  it("shows only the track still being raised", () => {
    render(
      <GoalTargetDisplay entityType="Mow" progress={ability(47, 50, 12, 12)} />
    )
    expect(pill("primary")).toBeInTheDocument()
    expect(pill("secondary")).toBeNull()
  })

  it("omits a track that already reached its target", () => {
    render(
      <GoalTargetDisplay entityType="Mow" progress={ability(50, 50, 12, 15)} />
    )
    expect(pill("primary")).toBeNull()
    expect(pill("secondary")).toBeInTheDocument()
  })
})

describe("Goal kind without a type label", () => {
  it("shows Ascension as icons only", () => {
    render(
      <GoalTargetDisplay
        progress={
          {
            kind: "Ascension",
            current: "Epic:OneStar",
            target: "Legendary:OneStar",
            ratio: 0.5,
          } as never
        }
      />
    )
    expect(screen.queryByText("Ascension")).not.toBeInTheDocument()
  })

  it("shows the word Unlock in the Goal cell and the shard count beside the bar", () => {
    const unlock = {
      kind: "Unlock",
      owned: 329,
      required: 500,
      ratio: 0.66,
    } as never
    const { container } = render(
      <>
        <GoalTargetDisplay progress={unlock} />
        <GoalProgressDisplay progress={unlock} />
      </>
    )
    expect(screen.getByText("Unlock")).toBeInTheDocument()
    expect(screen.getByTestId("goal-unlock-count")).toHaveTextContent(
      "329 / 500"
    )
    expect(container).not.toHaveTextContent("ownedOfTotal")
  })
})

describe("GoalTargetDisplay for Upgrade goals", () => {
  it("shows each material's image with its owned/needed count and name", () => {
    const { container } = render(
      <GoalTargetDisplay
        progress={
          {
            kind: "Upgrade",
            ratio: 0.25,
            materials: [
              {
                upgradeId: "upgA",
                label: "Sword",
                rarity: "Rare",
                owned: 5,
                quantity: 10,
              },
              { upgradeId: "upgB", label: "upgB", owned: null, quantity: 4 },
            ],
          } as never
        }
      />
    )
    const materials = screen.getAllByRole("img")
    expect(materials).toHaveLength(2)
    expect(materials[0]).toHaveAccessibleName(
      'goals.overview.upgradeMaterial:{"name":"Sword","owned":"5","quantity":10}'
    )
    expect(materials[0]).toHaveTextContent("5/10")
    expect(materials[1]).toHaveTextContent("–/4")
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByTestId("goal-upgrade-materials-more")).toBeNull()
    expect(container).not.toHaveTextContent("25%")
  })

  it("shows the first four materials and folds the rest into a +N chip", () => {
    const materials = Array.from({ length: 7 }, (_, index) => ({
      upgradeId: `upg${index}`,
      label: `Mat ${index}`,
      owned: index,
      quantity: 10,
    }))
    render(
      <GoalTargetDisplay
        progress={{ kind: "Upgrade", ratio: 0.3, materials } as never}
      />
    )
    expect(screen.getAllByRole("img")).toHaveLength(5)
    const more = screen.getByTestId("goal-upgrade-materials-more")
    expect(more).toHaveTextContent("+3")
    expect(more.getAttribute("title")?.split("\n")).toEqual(
      [4, 5, 6].map(
        (index) =>
          `goals.overview.upgradeMaterial:{"name":"Mat ${index}","owned":"${index}","quantity":10}`
      )
    )
  })

  it("falls back to the percentage when the goal has no materials", () => {
    render(
      <GoalTargetDisplay
        progress={{ kind: "Upgrade", ratio: 0.5, materials: [] } as never}
      />
    )
    expect(screen.getByText("50%")).toBeInTheDocument()
  })
})
