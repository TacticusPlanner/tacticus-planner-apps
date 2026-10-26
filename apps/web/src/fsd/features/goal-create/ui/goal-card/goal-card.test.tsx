import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import type {
  Progression,
  Rank as RankId,
  UpgradeId,
} from "@workspace/game-domain"

import { render, screen, within } from "@/test/render"

import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { AbilityGoalCard } from "./ability-goal-card"
import { AscensionGoalCard } from "./ascension-goal-card"
import type { ResourcePreview } from "./card-parts"
import { RankGoalCard, type RankTargetValue } from "./rank-goal-card"
import { UpgradeGoalCard } from "./upgrade-goal-card"

const MODES = ["create", "edit"] as const
const NO_KEYS: ReadonlySet<string> = new Set()
const content = (count: number): ResourcePreview => ({
  state: "content",
  missingUpgrades: Array.from({ length: count }, (_, index) => ({
    id: `upg${index}`,
    label: `Material ${index}`,
    missing: 1,
  })),
})

function RankCard({
  mode,
  preview = content(2),
}: {
  mode: "create" | "edit"
  preview?: ResourcePreview
}) {
  const [value, setValue] = useState<RankTargetValue>({
    end: "Diamond2" as RankId,
    additional: "None",
  })
  return (
    <RankGoalCard
      additionalTargetChoices={["None"]}
      farmingStrategy="EveryStep"
      issues={[]}
      milestones={<p>Milestones here</p>}
      mode={mode}
      onChange={setValue}
      onFarmingStrategyChange={vi.fn()}
      preview={preview}
      start={"Gold2" as RankId}
      takenKeys={NO_KEYS}
      value={value}
    />
  )
}

describe("RankGoalCard", () => {
  it("states the selected range and what it needs, and follows a new target", async () => {
    render(<RankCard mode="create" />)

    const range = screen.getByTestId("goal-card-range")
    expect(range).toHaveTextContent(
      "Gold II → Diamond II · 2 materials to farm"
    )
    await userEvent.click(screen.getByRole("radio", { name: "Diamond III" }))
    expect(range).toHaveTextContent("Gold II → Diamond III")
  })

  it("says the cost is loading or failed while its preview is", () => {
    const { rerender } = render(
      <RankCard
        mode="create"
        preview={{ state: "loading", missingUpgrades: [] }}
      />
    )
    expect(screen.getByTestId("goal-card-range")).toHaveTextContent(
      "Gold II → Diamond II · Calculating the resources…"
    )
    rerender(
      <RankCard
        mode="create"
        preview={{ state: "failed", missingUpgrades: [] }}
      />
    )
    expect(screen.getByTestId("goal-card-range")).toHaveAttribute(
      "data-state",
      "failed"
    )
  })

  it.each(MODES)("shows milestones only in creation (%s)", (mode) => {
    render(<RankCard mode={mode} />)

    if (mode === "create") {
      expect(screen.getByText("Milestones here")).toBeInTheDocument()
    } else {
      expect(screen.queryByText("Milestones here")).not.toBeInTheDocument()
    }
    // Both modes share the ladder, the additional target and the strategy.
    expect(screen.getByTestId("create-goal-rank-end")).toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-rank-additional-target")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-farming-strategy")
    ).toBeInTheDocument()
  })
})

describe("AscensionGoalCard", () => {
  const reached: GoalFormIssueView = {
    kind: "Ascension",
    field: "target",
    code: "progressionAlreadyReached",
    message: "The selected progression has already been reached.",
  }

  it.each(MODES)(
    "shows the target-reached message under the ladder and marks it invalid (%s)",
    (mode) => {
      render(
        <AscensionGoalCard
          issues={[reached]}
          milestones={<p>Milestones here</p>}
          mode={mode}
          onChange={vi.fn()}
          preview={null}
          start={"Epic:RedTwoStars" as Progression}
          takenKeys={NO_KEYS}
          value={"Epic:RedOneStar" as Progression}
        />
      )

      const ladder = screen.getByTestId("create-goal-ascension-end")
      expect(ladder).toHaveAttribute("aria-invalid", "true")
      expect(ladder).toHaveAccessibleDescription(reached.message)
      expect(
        within(ladder).getByRole("radio", { checked: true })
      ).toHaveAccessibleName("Epic Red One Star")
      expect(screen.queryByText("Milestones here") !== null).toBe(
        mode === "create"
      )
    }
  )
})

function Ability({
  start,
  progressionCap = 50,
}: {
  start: number
  progressionCap?: number
}) {
  const [value, setValue] = useState({ active: start, passive: start })
  return (
    <AbilityGoalCard
      entityType="Character"
      issues={[]}
      mode="create"
      onChange={setValue}
      rarityCap={progressionCap}
      start={{ active: start, passive: start }}
      value={value}
    />
  )
}

const activeStepper = () =>
  screen.getByTestId("create-goal-ability-active-target")
const pick = (name: RegExp) =>
  userEvent.click(within(activeStepper()).getByRole("button", { name }))
const activeLevel = () =>
  within(activeStepper()).getByRole("spinbutton", {
    name: "Active ability, target level",
  })

describe("AbilityGoalCard", () => {
  it("offers Next, +5 and the rarity cap for a Legendary unit at 35", async () => {
    render(<Ability start={35} />)

    await pick(/^Next/)
    expect(activeLevel()).toHaveValue(36)
    await pick(/^\+5/)
    expect(activeLevel()).toHaveValue(40)
    await pick(/^Rarity cap/)
    expect(activeLevel()).toHaveValue(50)
  })

  it("hides the rarity cap at the cap, where Next goes past it", async () => {
    render(<Ability start={50} />)

    expect(
      within(activeStepper()).queryByRole("button", { name: /^Rarity cap/ })
    ).not.toBeInTheDocument()
    await pick(/^Next/)
    expect(activeLevel()).toHaveValue(51)
  })

  it("starts each track at no change, and can't go below it", async () => {
    render(<Ability start={35} />)

    expect(activeStepper()).toHaveTextContent("No change")
    const lower = within(activeStepper()).getByRole("button", {
      name: "Lower Active ability, target level",
    })
    expect(lower).toBeDisabled()
    await userEvent.click(
      within(activeStepper()).getByRole("button", {
        name: "Raise Active ability, target level",
      })
    )
    expect(activeLevel()).toHaveValue(36)
    expect(lower).toBeEnabled()
  })

  it("passes a typed level outside the range on, for the card's range message", async () => {
    const onChange = vi.fn()
    render(
      <AbilityGoalCard
        entityType="Character"
        issues={[
          {
            kind: "Ability",
            field: "target",
            code: "abilityOutOfRange",
            message: "Choose a level from the current one up to 60.",
          },
        ]}
        mode="edit"
        onChange={onChange}
        rarityCap={50}
        start={{ active: 35, passive: 35 }}
        value={{ active: 61, passive: 35 }}
      />
    )

    expect(activeLevel()).toHaveValue(61)
    expect(activeLevel()).toHaveAccessibleDescription(
      "Choose a level from the current one up to 60."
    )
    expect(
      within(activeStepper()).getByRole("button", {
        name: "Raise Active ability, target level",
      })
    ).toBeDisabled()
  })
})

describe("UpgradeGoalCard", () => {
  const targets = [
    { upgradeId: "upgA", quantity: Number.NaN },
    { upgradeId: "upgB", quantity: 2 },
  ]
  const issue: GoalFormIssueView = {
    kind: "Upgrade",
    field: "quantity-upgA",
    code: "upgradeQuantity",
    message: "Enter a whole number from 1 to 10,000.",
  }

  it.each(MODES)(
    "shows a cleared quantity's message on that material's row only (%s)",
    (mode) => {
      render(
        <UpgradeGoalCard
          choices={new Map()}
          issues={[issue]}
          mode={mode}
          onAdd={vi.fn()}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
          preview={content(0)}
          targets={targets}
          upgradesById={new Map()}
        />
      )

      expect(
        screen.getByTestId("create-goal-upgrade-target-upgA" as UpgradeId)
      ).toHaveTextContent(issue.message)
      expect(
        screen.getByTestId("create-goal-upgrade-target-upgB")
      ).not.toHaveTextContent(issue.message)
    }
  )

  it("keeps an edited goal's last material", () => {
    render(
      <UpgradeGoalCard
        choices={new Map()}
        issues={[]}
        mode="edit"
        onAdd={vi.fn()}
        onQuantityChange={vi.fn()}
        onRemove={vi.fn()}
        preview={content(0)}
        targets={[{ upgradeId: "upgB", quantity: 2 }]}
        upgradesById={new Map()}
      />
    )

    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled()
  })
})
