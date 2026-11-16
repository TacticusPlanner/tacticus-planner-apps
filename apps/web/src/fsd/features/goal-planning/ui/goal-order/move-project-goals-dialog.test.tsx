import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import type { ProjectSummary } from "@/entities/project"
import { render, screen } from "@/test/render"

import { MoveProjectGoalsDialog } from "./move-project-goals-dialog"

const { moveMock } = vi.hoisted(() => ({ moveMock: vi.fn() }))

vi.mock("../../model/goal-order/use-move-project-goals", () => ({
  useMoveProjectGoals: () => ({ move: moveMock, pending: false }),
}))

const project = (
  projectId: string,
  name: string,
  status: ProjectSummary["status"] = "Active"
): ProjectSummary => ({
  projectId,
  name,
  status,
  color: null,
  description: null,
  isDefault: false,
  target: null,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  goalIds: [],
})

const goal = (
  goalId: string,
  globalPriority: number,
  projectIds: string[]
) => ({
  goalId,
  status: "Active",
  globalPriority,
  projectIds,
})

// A (Lavi), B (GW), C (Chaos), D (GW), E (Chaos), F (Lavi)
const goals = [
  goal("A", 1, ["lavi"]),
  goal("B", 2, ["gw"]),
  goal("C", 3, ["chaos"]),
  goal("D", 4, ["gw"]),
  goal("E", 5, ["chaos"]),
  goal("F", 6, ["lavi"]),
]
const projects = [
  project("lavi", "Team Lavi"),
  project("gw", "GW S29"),
  project("chaos", "Chaos Core"),
  project("old", "Old", "Archived"),
]

describe("MoveProjectGoalsDialog", () => {
  beforeEach(() => moveMock.mockReset().mockResolvedValue(true))

  it("moves the project's goals before the chosen project", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <MoveProjectGoalsDialog
        goals={goals}
        onOpenChange={onOpenChange}
        project={projects[2]!}
        projects={projects}
      />
    )

    await user.click(await screen.findByTestId("move-goals-choice-before"))
    expect(screen.getByTestId("move-goals-confirm")).toBeDisabled()
    await user.click(screen.getByTestId("move-goals-reference"))
    const options = await screen.findAllByRole("option")
    // Usable projects only, by name: the archived one is left out.
    expect(options.map((option) => option.textContent)).toEqual([
      "GW S29",
      "Team Lavi",
    ])
    await user.click(screen.getByRole("option", { name: "GW S29" }))
    await user.click(screen.getByTestId("move-goals-confirm"))

    expect(moveMock).toHaveBeenCalledWith(["C", "E"], {
      kind: "before",
      referenceIds: ["B", "D"],
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("stays open with the choice kept when the move fails", async () => {
    moveMock.mockResolvedValue(false)
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <MoveProjectGoalsDialog
        goals={goals}
        onOpenChange={onOpenChange}
        project={projects[2]!}
        projects={projects}
      />
    )

    await user.click(await screen.findByTestId("move-goals-choice-before"))
    await user.click(screen.getByTestId("move-goals-reference"))
    await user.click(await screen.findByRole("option", { name: "GW S29" }))
    await user.click(screen.getByTestId("move-goals-confirm"))

    expect(moveMock).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByTestId("move-goals-confirm")).toBeEnabled()
  })

  it("offers only To the top when no other project can be placed against", async () => {
    render(
      <MoveProjectGoalsDialog
        goals={[goal("A", 1, ["lavi"]), goal("C", 2, ["chaos"])]}
        onOpenChange={vi.fn()}
        project={projects[2]!}
        projects={[projects[2]!, project("lavi", "Team Lavi", "Archived")]}
      />
    )

    expect(await screen.findByTestId("move-goals-choice-top")).toBeEnabled()
    expect(screen.getByTestId("move-goals-choice-before")).toBeDisabled()
    expect(screen.getByTestId("move-goals-choice-after")).toBeDisabled()
    expect(
      screen.getAllByText("No other project to place against")
    ).toHaveLength(2)
  })
})
