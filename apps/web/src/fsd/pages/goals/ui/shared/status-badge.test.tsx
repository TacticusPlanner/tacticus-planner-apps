import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    upgradesById: new Map(),
    charactersById: new Map(),
  }),
}))

import { BlockedIndicator } from "./status-badge"

describe("BlockedIndicator", () => {
  it("renders nothing when not blocked", () => {
    render(<BlockedIndicator blockers={{ reasons: [], isBlocked: false }} />)
    expect(screen.queryByTestId("goal-blocked-indicator")).toBeNull()
    expect(screen.queryByTestId("goal-restricted-indicator")).toBeNull()
  })

  it("renders a softer 'Restricted' indicator when the only reason is an unmet prerequisite", () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
          isBlocked: true,
        }}
      />
    )
    expect(screen.getByTestId("goal-restricted-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-blocked-indicator")).toBeNull()
  })

  it.each([
    [
      "missing Ascension prerequisite",
      {
        kind: "MissingAscensionPrerequisite",
        requiredProgression: "Rare:FourStars",
        existingGoalId: undefined,
      },
    ],
    [
      "missing Unlock prerequisite",
      {
        kind: "MissingUnlockPrerequisite",
        unitName: "Bellator",
        existingGoalId: undefined,
      },
    ],
  ] as const)(
    "renders a softer 'Restricted' indicator for a %s",
    (_description, reason) => {
      render(
        <BlockedIndicator blockers={{ reasons: [reason], isBlocked: true }} />
      )
      expect(
        screen.getByTestId("goal-restricted-indicator")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("goal-blocked-indicator")).toBeNull()
    }
  )

  it("renders a softer 'Restricted' indicator for mixed prerequisite-style reasons", () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [
            {
              kind: "MissingUnlockPrerequisite",
              unitName: "Bellator",
              existingGoalId: undefined,
            },
            { kind: "PrerequisiteNotReached", goalId: "goal-2" },
          ],
          isBlocked: true,
        }}
      />
    )
    expect(screen.getByTestId("goal-restricted-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-blocked-indicator")).toBeNull()
  })

  it("renders the stronger 'Blocked' indicator for a non-prerequisite reason", () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PlayerDataUnavailable" }],
          isBlocked: true,
        }}
      />
    )
    expect(screen.getByTestId("goal-blocked-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-restricted-indicator")).toBeNull()
  })

  it("renders the stronger 'Blocked' indicator when a prerequisite reason is combined with another", () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [
            { kind: "PrerequisiteNotReached", goalId: "goal-2" },
            { kind: "PlayerDataUnavailable" },
          ],
          isBlocked: true,
        }}
      />
    )
    expect(screen.getByTestId("goal-blocked-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-restricted-indicator")).toBeNull()
  })

  it("shows the reason text in a hover tooltip on the Restricted indicator, not a native title", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
          isBlocked: true,
        }}
      />
    )
    const badge = screen.getByTestId("goal-restricted-indicator")
    expect(badge).not.toHaveAttribute("title")
    await userEvent.hover(badge)
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Waiting on a prerequisite goal to be reached first."
    )
  })

  it("shows the reason text in a hover tooltip on the Blocked indicator, not a native title", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PlayerDataUnavailable" }],
          isBlocked: true,
        }}
      />
    )
    const badge = screen.getByTestId("goal-blocked-indicator")
    expect(badge).not.toHaveAttribute("title")
    await userEvent.hover(badge)
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Player data for this goal hasn't synced yet."
    )
  })

  it("lists the blocked estimate's unavailable materials after the reasons in the tooltip", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PlayerDataUnavailable" }],
          isBlocked: true,
        }}
        estimate={{
          status: "Blocked",
          reason: "NoFarmLocation",
          resourceIds: ["upgHpM004" as never],
          actionableResourceIds: [],
          blockers: [
            {
              resourceId: "upgHpM004" as never,
              reason: "NoFarmLocation",
              remaining: 6,
            },
          ],
        }}
      />
    )
    await userEvent.hover(screen.getByTestId("goal-blocked-indicator"))
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent(
      "Player data for this goal hasn't synced yet."
    )
    expect(tooltip).toHaveTextContent(
      "Venerable Battle Mark ×6: No accessible farming location provides a required resource."
    )
  })

  it("shows a duplicate-text reason only once, when two different prerequisite goals produce the same generic sentence", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [
            { kind: "PrerequisiteNotReached", goalId: "goal-2" },
            { kind: "PrerequisiteNotReached", goalId: "goal-3" },
          ],
          isBlocked: true,
        }}
      />
    )
    const badge = screen.getByTestId("goal-restricted-indicator")
    await userEvent.hover(badge)
    const tooltip = await screen.findByTestId("goal-restricted-tooltip")
    const occurrences = (
      tooltip.textContent?.match(
        /Waiting on a prerequisite goal to be reached first\./g
      ) ?? []
    ).length
    expect(occurrences).toBe(1)
  })

  it("opens the Restricted tooltip with an explanation of what Restricted means", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
          isBlocked: true,
        }}
      />
    )
    await userEvent.hover(screen.getByTestId("goal-restricted-indicator"))
    const tooltip = await screen.findByTestId("goal-restricted-tooltip")
    expect(tooltip.textContent).toMatch(
      /^Restricted: this goal can only partly progress until the following is resolved\./
    )
  })

  it("names each unreached prerequisite goal on its own line", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [
            {
              kind: "PrerequisiteNotReached",
              goalId: "goal-2",
              prerequisite: { unitName: "Bellator", goalType: "Unlock" },
            },
            {
              kind: "PrerequisiteNotReached",
              goalId: "goal-3",
              prerequisite: { unitName: "Calgar", goalType: "Ascension" },
            },
          ],
          isBlocked: true,
        }}
      />
    )
    await userEvent.hover(screen.getByTestId("goal-restricted-indicator"))
    const tooltip = await screen.findByTestId("goal-restricted-tooltip")
    expect(tooltip).toHaveTextContent(
      "Waiting on the Bellator Unlock goal to be reached first."
    )
    expect(tooltip).toHaveTextContent(
      "Waiting on the Calgar Ascension goal to be reached first."
    )
  })

  it("does not add the explanation to the Blocked tooltip", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PlayerDataUnavailable" }],
          isBlocked: true,
        }}
      />
    )
    await userEvent.hover(screen.getByTestId("goal-blocked-indicator"))
    expect(await screen.findByRole("tooltip")).not.toHaveTextContent(
      "Restricted: this goal can only partly progress until the following is resolved."
    )
  })

  it("folds the reachable-ceiling line into the Restricted tooltip when progress is passed", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
          isBlocked: true,
        }}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Silver1",
            ratio: 0.1,
            reachableRatio: 0.5,
            reachableRank: "Bronze1",
            reachableRankLimitedBy: "level",
          } as never
        }
      />
    )
    const badge = screen.getByTestId("goal-restricted-indicator")
    await userEvent.hover(badge)
    const tooltip = await screen.findByTestId("goal-restricted-tooltip")
    expect(tooltip).toHaveTextContent(
      "Waiting on a prerequisite goal to be reached first."
    )
    expect(tooltip).toHaveTextContent("Currently reachable:")
    expect(tooltip).toHaveTextContent("Bronze I")
    expect(tooltip).toHaveTextContent("capped by level")
  })

  it("renders both indicators as keyboard-focusable buttons, and Tab reaches and opens their tooltip", async () => {
    const user = userEvent.setup()
    render(
      <>
        <BlockedIndicator
          blockers={{
            reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
            isBlocked: true,
          }}
        />
        <BlockedIndicator
          blockers={{
            reasons: [{ kind: "PlayerDataUnavailable" }],
            isBlocked: true,
          }}
        />
      </>
    )
    const restricted = screen.getByTestId("goal-restricted-indicator")
    const blocked = screen.getByTestId("goal-blocked-indicator")
    expect(restricted.tagName).toBe("BUTTON")
    expect(blocked.tagName).toBe("BUTTON")

    await user.tab()
    expect(restricted).toHaveFocus()
    expect(
      await screen.findByTestId("goal-restricted-tooltip")
    ).toBeInTheDocument()

    await user.tab()
    expect(blocked).toHaveFocus()
    expect(
      await screen.findByTestId("goal-blocked-tooltip")
    ).toBeInTheDocument()
  })

  it("omits the reachable-ceiling line when the goal isn't currently restricted by rarity/level", async () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [{ kind: "PrerequisiteNotReached", goalId: "goal-2" }],
          isBlocked: true,
        }}
        progress={
          {
            kind: "Rank",
            current: "Stone1",
            target: "Silver1",
            ratio: 0.1,
            reachableRatio: null,
            reachableRank: null,
            reachableRankLimitedBy: null,
          } as never
        }
      />
    )
    const badge = screen.getByTestId("goal-restricted-indicator")
    await userEvent.hover(badge)
    const tooltip = await screen.findByTestId("goal-restricted-tooltip")
    expect(tooltip).not.toHaveTextContent("Currently reachable:")
  })

  it.each([
    [
      "a partial plan (obtainable work remains)",
      true,
      "goal-restricted-indicator",
    ],
    ["nothing obtainable", false, "goal-blocked-indicator"],
  ])(
    "presents an estimate block with %s as the matching label",
    (_d, partial, testId) => {
      render(
        <BlockedIndicator
          blockers={{
            reasons: [
              { kind: "EstimateBlocked", reason: "NoFarmLocation", partial },
            ],
            isBlocked: true,
          }}
        />
      )
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  )

  it("keeps Blocked when a partial estimate block sits beside a non-source reason", () => {
    render(
      <BlockedIndicator
        blockers={{
          reasons: [
            {
              kind: "EstimateBlocked",
              reason: "NoFarmLocation",
              partial: true,
            },
            { kind: "PlayerDataUnavailable" },
          ],
          isBlocked: true,
        }}
      />
    )
    expect(screen.getByTestId("goal-blocked-indicator")).toBeInTheDocument()
  })
})
