import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import type { UnitId } from "@workspace/game-domain"

import type { CreateCombinedGoalsRequest, GoalDetail } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import userEvent from "@testing-library/user-event"

import type { BulkGoalUnit } from "../../model/bulk-create/bulk-goal-plan"

const api = vi.hoisted(() => ({
  goals: new Map<string, GoalDetail>(),
  create: vi.fn<(request: CreateCombinedGoalsRequest) => Promise<unknown>>(),
  createProject: vi.fn<(request: { name: string }) => Promise<unknown>>(),
}))
vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  useGoalsById: () => ({ goalsById: api.goals, loading: false }),
  createCombinedGoals: api.create,
}))
vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  useProjects: () => ({ projects: [], defaultProjectId: "default" }),
  createProject: api.createProject,
}))

import { BulkGoalDialog } from "./bulk-goal-dialog"

const ragnar: BulkGoalUnit = {
  kind: "character",
  unitId: "spaceRagnar" as UnitId,
  name: "Ragnar",
  owned: true,
  progression: "Legendary:RedThreeStars",
  rank: "Gold1",
  abilityLevels: [30, 28],
}
const tigurius: BulkGoalUnit = {
  kind: "character",
  unitId: "ultraTigurius" as UnitId,
  name: "Tigurius",
  owned: true,
  progression: "Epic:RedOneStar",
  rank: "Silver3",
  abilityLevels: [20, 20],
}
const galatian: BulkGoalUnit = {
  kind: "mow",
  unitId: "adeptaGalatian" as UnitId,
  name: "Galatian",
  owned: true,
  progression: "Rare:FourStars",
  abilityLevels: [10, 10],
}

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
  // The app reads unprefixed keys from common.
  i18n.setDefaultNamespace("common")
})
beforeEach(() => {
  api.goals = new Map()
  api.create.mockReset().mockResolvedValue({})
  api.createProject.mockReset().mockImplementation(async ({ name }) => ({
    projectId: "new-project",
    name,
    description: null,
    color: null,
    isDefault: false,
    status: "Active",
    goalIds: [],
  }))
})

function renderDialog(units: BulkGoalUnit[]) {
  const onCreated = vi.fn()
  const onOpenChange = vi.fn()
  const onRemoveUnit = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <BulkGoalDialog
        onCreated={onCreated}
        onOpenChange={onOpenChange}
        onRemoveUnit={onRemoveUnit}
        open
        units={units}
      />
    </I18nextProvider>
  )
  return { onCreated, onOpenChange, onRemoveUnit }
}

const rows = () => screen.getAllByTestId("bulk-goal-unit")

describe("BulkGoalDialog", () => {
  it("plans each unit from the shared Rank target, with skips and their reasons", () => {
    renderDialog([ragnar, tigurius, galatian])

    // Rank is on by default at Diamond III.
    expect(rows()[0]).toHaveTextContent("Rank")
    expect(rows()[1]).toHaveTextContent("(needed)")
    expect(rows()[2]).toHaveTextContent("Rank skipped: not for Machines of War")
    expect(rows()[2]).toHaveTextContent("Nothing to create for this unit.")
    expect(screen.getByTestId("bulk-goal-summary")).toHaveTextContent(
      "3 goals for 2 units"
    )
  })

  it("sends one request per unit and continues past a failure, then retries only the failed one", async () => {
    api.create.mockImplementation(async (request) => {
      if (request.entityId === "spaceRagnar")
        throw new ApiError(503, "API request failed with status 503")
      return {}
    })
    const { onCreated, onOpenChange } = renderDialog([ragnar, tigurius])

    fireEvent.click(screen.getByTestId("bulk-goal-create"))
    await waitFor(() =>
      expect(screen.getByTestId("bulk-goal-retry")).toBeInTheDocument()
    )
    expect(api.create).toHaveBeenCalledTimes(2)
    expect(api.create.mock.calls[0]![0]).toMatchObject({
      entityType: "Character",
      entityId: "spaceRagnar",
      projects: [{ projectId: "default" }],
    })
    expect(rows()[0]).toHaveAttribute("data-status", "failed")
    expect(
      within(rows()[0]!).getByText(
        "Couldn't reach the server. Please try again."
      )
    ).toBeInTheDocument()
    expect(rows()[1]).toHaveAttribute("data-status", "done")

    api.create.mockResolvedValue({})
    fireEvent.click(screen.getByTestId("bulk-goal-retry"))
    await waitFor(() =>
      expect(rows()[0]).toHaveAttribute("data-status", "done")
    )
    expect(api.create).toHaveBeenCalledTimes(3)
    expect(api.create.mock.calls[2]![0].entityId).toBe("spaceRagnar")
    expect(screen.getByTestId("bulk-goal-summary")).toHaveTextContent(
      "Created 3 goals."
    )

    fireEvent.click(screen.getByTestId("bulk-goal-done"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onCreated).toHaveBeenCalled()
  })

  it("disables Create when nothing would be created", () => {
    renderDialog([galatian])
    expect(screen.getByTestId("bulk-goal-create")).toBeDisabled()
  })

  it("lets the player remove a unit before creating", () => {
    const { onRemoveUnit } = renderDialog([ragnar, tigurius])
    fireEvent.click(screen.getByRole("button", { name: "Remove Tigurius" }))
    expect(onRemoveUnit).toHaveBeenCalledWith("character:ultraTigurius")
  })

  it("creates a new project from the dialog and adds the goals to it", async () => {
    const user = userEvent.setup()
    renderDialog([ragnar])

    await user.click(screen.getByTestId("bulk-goal-add-project"))
    await user.type(screen.getByPlaceholderText("Search projects"), "Raids")
    await user.click(screen.getByTestId("bulk-goal-create-project"))
    await waitFor(() =>
      expect(api.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Raids" })
      )
    )

    await user.click(screen.getByTestId("bulk-goal-create"))
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1))
    expect(api.create.mock.calls[0]![0].projects).toEqual([
      { projectId: "default" },
      { projectId: "new-project" },
    ])
  })

  it("starts the targets above the lowest current value, snapping the default up", () => {
    const veteran: BulkGoalUnit = {
      ...ragnar,
      progression: "Mythic:OneBlueStar",
      rank: "Diamond3",
      abilityLevels: [50, 50],
    }
    renderDialog([veteran])

    // The default Diamond III is already reached, so Rank starts at Adamantine I.
    expect(rows()[0]).toHaveTextContent("Diamond III → Adamantine I")
    expect(screen.getByTestId("bulk-goal-summary")).toHaveTextContent(
      "1 goal for 1 unit"
    )
  })

  it("disables a target every listed unit has already reached", () => {
    const maxed: BulkGoalUnit = {
      ...ragnar,
      progression: "Mythic:MythicWings",
      rank: "Adamantine2",
      abilityLevels: [60, 60],
    }
    renderDialog([maxed])

    expect(screen.getByTestId("bulk-goal-rank-toggle")).toBeDisabled()
    expect(screen.getByTestId("bulk-goal-ascension-toggle")).toBeDisabled()
    expect(screen.getByTestId("bulk-goal-ability-toggle")).toBeDisabled()
    expect(
      screen.getAllByText("Every selected unit is already at the top.")
    ).toHaveLength(3)
  })
})
