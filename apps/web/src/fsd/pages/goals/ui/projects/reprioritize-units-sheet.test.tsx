import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  reorderProjectUnits,
  type ProjectUnitPlan,
} from "../../model/projects/project-unit-plans"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: { unit?: string }) =>
      values?.unit ? `${key}:${values.unit}` : key,
  }),
}))

vi.mock("../../model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    getEntityName: (_type: string, id: string) => id.toUpperCase(),
  }),
}))

vi.mock("../shared/goal-visuals", () => ({
  GoalUnitIcon: () => <span data-testid="unit-icon" />,
}))

import { ReprioritizeUnitsSheet } from "./reprioritize-units-sheet"

function unit(
  entityId: string,
  goalTypes: ProjectUnitPlan["goals"][number]["goalType"][]
): ProjectUnitPlan {
  return {
    entityType: "Character",
    entityId,
    position: 1,
    goals: goalTypes.map((goalType, index) => ({
      goalId: `${entityId}-${index}`,
      entityType: "Character",
      entityId,
      goalType,
      status: "Active",
      notes: null,
      updatedAt: "2026-08-09T00:00:00Z",
      dependsOn: [],
      priority: index + 1,
    })),
    historicalGoals: [],
    statusCounts: {
      Active: goalTypes.length,
      Paused: 0,
      Completed: 0,
      Archived: 0,
    },
    blockedCount: 0,
    estimate: undefined,
  }
}

describe("ReprioritizeUnitsSheet", () => {
  const units = [
    unit("ragnar", ["Rank", "Ability"]),
    unit("calgar", ["Ascension"]),
  ]

  it("moves the whole unit block with its automatically ordered goals and saves the unit keys", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(true)
    const onOpenChange = vi.fn()
    const reordered = reorderProjectUnits(
      units,
      "Character:ragnar",
      "Character:calgar"
    )
    render(
      <ReprioritizeUnitsSheet
        onOpenChange={onOpenChange}
        onSave={onSave}
        open
        pending={false}
        units={reordered}
      />
    )

    expect(screen.getByText("Rank · Ability")).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "goals.project.dragUnit:RAGNAR",
      })
    ).toHaveAttribute("aria-roledescription", "sortable")
    await user.click(screen.getByRole("button", { name: "goals.project.save" }))

    expect(onSave).toHaveBeenCalledWith([
      { entityType: "Character", entityId: "calgar" },
      { entityType: "Character", entityId: "ragnar" },
    ])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("discards the draft on cancel and preserves it when save reports a conflict", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(false)
    const onOpenChange = vi.fn()
    render(
      <ReprioritizeUnitsSheet
        onOpenChange={onOpenChange}
        onSave={onSave}
        open
        pending={false}
        units={units}
      />
    )

    await user.click(screen.getByRole("button", { name: "goals.project.save" }))
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole("button", { name: "goals.project.cancel" })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
