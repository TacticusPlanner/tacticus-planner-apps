import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
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
      "goals.blocked.reasons.PrerequisiteNotReached"
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
      "goals.blocked.reasons.PlayerDataUnavailable"
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
        /goals\.blocked\.reasons\.PrerequisiteNotReached/g
      ) ?? []
    ).length
    expect(occurrences).toBe(1)
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
      "goals.blocked.reasons.PrerequisiteNotReached"
    )
    expect(tooltip).toHaveTextContent("reachableCeilingLabel")
    expect(tooltip).toHaveTextContent("ranks.Bronze1")
    expect(tooltip).toHaveTextContent("reachableCeilingReasonLevel")
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
    expect(tooltip).not.toHaveTextContent("reachableCeilingLabel")
  })
})
