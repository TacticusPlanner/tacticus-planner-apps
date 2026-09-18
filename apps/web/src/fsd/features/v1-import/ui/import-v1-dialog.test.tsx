import { fireEvent, render, screen, waitFor } from "@/test/render"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const importV1Profile = vi.fn()
const createCombinedGoals = vi.fn()
const buildCreateGoalSnapshot = vi.fn()
const getPlayerCharacter = vi.fn()
const getPlayerMow = vi.fn()
const refetch = vi.fn()
const onOpenChange = vi.fn()
const account = { homeAccountId: "account-1" }
const instance = { getActiveAccount: () => account }
const mockSnapshot = { initialRank: "Stone1", initialUnlocked: true }

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance, accounts: [account] }),
}))

vi.mock("@/entities/account", () => ({
  importV1Profile: (...args: unknown[]) => importV1Profile(...args),
  useCurrentUser: () => ({ refetch }),
  accountQueries: { all: () => ["current-user"] },
}))

vi.mock("@/entities/goal", () => ({
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
  buildCreateGoalSnapshot: (...args: unknown[]) =>
    buildCreateGoalSnapshot(...args),
  goalQueries: { all: () => ["goals"] },
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: { all: () => ["projects"] },
}))

vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    all: () => ["player-data-overrides"],
  },
  campaignEventProgressQueries: {
    all: () => ["player-data-overrides", "campaign-events"],
  },
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: (...args: unknown[]) => getPlayerCharacter(...args),
  getPlayerMow: (...args: unknown[]) => getPlayerMow(...args),
}))

import { ImportV1Dialog } from "./import-v1-dialog"

const goalSpec = (entityId: string) => ({
  entityType: "Character",
  entityId,
  goals: [{ goalType: "Rank", config: {}, dependsOnIndex: [] }],
})

const submittedSpec = (entityId: string) => ({
  entityType: "Character",
  entityId,
  goals: [
    {
      goalType: "Rank",
      config: {},
      dependsOnIndex: [],
      snapshot: mockSnapshot,
    },
  ],
})

describe("ImportV1Dialog", () => {
  beforeEach(() => {
    importV1Profile.mockReset().mockResolvedValue({
      personalTacticusApiKey: { status: "Imported" },
      tacticusUserId: { status: "Imported" },
      guildApiToken: { status: "Skipped" },
      onslaughtProgress: { status: "Imported" },
      campaignEventProgress: { status: "Imported" },
      goals: { status: "Imported" },
      goalSpecs: [goalSpec("unit-1"), goalSpec("unit-2")],
      goalsSkipped: 3,
      goalIssues: [],
    })
    createCombinedGoals.mockReset().mockResolvedValue({ goals: [] })
    buildCreateGoalSnapshot.mockReset().mockReturnValue(mockSnapshot)
    getPlayerCharacter.mockReset().mockResolvedValue(undefined)
    getPlayerMow.mockReset().mockResolvedValue(undefined)
    refetch.mockReset()
    onOpenChange.mockReset()
  })

  it("submits credentials with the user's selected import parts, then creates each imported goal spec through the standard create mutation", async () => {
    const invalidateQueries = vi.spyOn(
      QueryClient.prototype,
      "invalidateQueries"
    )
    render(<ImportV1Dialog open onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "  legacy-user  " },
    })
    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByTestId("v1-import-guildApiToken"))
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await waitFor(() => {
      expect(importV1Profile).toHaveBeenCalledWith(
        {
          username: "legacy-user",
          password: "secret",
          import: {
            personalTacticusApiKey: true,
            tacticusUserId: true,
            guildApiToken: false,
            goals: true,
            onslaughtProgress: true,
            campaignEventProgress: true,
          },
        },
        expect.anything()
      )
    })

    await waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(2)
    })
    expect(getPlayerCharacter).toHaveBeenCalledTimes(2)
    expect(getPlayerMow).not.toHaveBeenCalled()
    expect(createCombinedGoals.mock.calls[0][0]).toEqual(
      submittedSpec("unit-1")
    )
    expect(createCombinedGoals.mock.calls[1][0]).toEqual(
      submittedSpec("unit-2")
    )

    expect(await screen.findByTestId("v1-import-result")).toHaveTextContent(
      "Imported"
    )
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["player-data-overrides"],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["player-data-overrides", "campaign-events"],
    })
    invalidateQueries.mockRestore()
  })

  it("counts a failed goal-spec submission without blocking the others", async () => {
    createCombinedGoals
      .mockResolvedValueOnce({ goals: [] })
      .mockRejectedValueOnce(new Error("create failed"))
    render(<ImportV1Dialog open onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "legacy-user" },
    })
    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    const result = await screen.findByTestId("v1-import-result")
    await waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(2)
    })
    expect(result).toHaveTextContent("goals.v1Import.goalCounts")
  })

  it("shows an import failure without refreshing account state", async () => {
    importV1Profile.mockRejectedValue(new Error("network"))
    render(<ImportV1Dialog open onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "legacy-user" },
    })
    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.v1Import.error"
    )
    expect(refetch).not.toHaveBeenCalled()
    expect(createCombinedGoals).not.toHaveBeenCalled()

    // 4.1 — failure keeps the dialog usable: no lingering progress indication, username preserved,
    // dialog stays open (rendered), and correcting the password re-enables submit.
    expect(
      screen.queryByTestId("v1-import-submit")?.querySelector("svg")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("v1-import-username")).toHaveValue("legacy-user")
    expect(screen.getByTestId("v1-import-dialog")).toBeInTheDocument()
    // The rejected password is still in the field (only a completed run clears it), so the control
    // is already available — correcting the password keeps it that way for the retry.
    expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "a-different-password" },
    })
    expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

    importV1Profile.mockReset().mockResolvedValue({
      personalTacticusApiKey: { status: "Imported" },
      tacticusUserId: { status: "Imported" },
      guildApiToken: { status: "Imported" },
      onslaughtProgress: { status: "Imported" },
      campaignEventProgress: { status: "Imported" },
      goals: { status: "Imported" },
      goalSpecs: [],
      goalsSkipped: 0,
      goalIssues: [],
    })
    fireEvent.click(screen.getByTestId("v1-import-submit"))
    await waitFor(() => {
      expect(importV1Profile).toHaveBeenCalledTimes(1)
    })
  })

  // 1.1/1.2/2.1-2.4/3.1-3.3 — the unified `canSubmit` predicate and the post-run state.
  describe("resubmitting after a completed run", () => {
    beforeEach(() => {
      importV1Profile.mockReset().mockResolvedValue({
        personalTacticusApiKey: { status: "Imported" },
        tacticusUserId: { status: "Imported" },
        guildApiToken: { status: "Imported" },
        onslaughtProgress: { status: "Imported" },
        campaignEventProgress: { status: "Imported" },
        goals: { status: "Skipped" },
        goalSpecs: [],
        goalsSkipped: 0,
        goalIssues: [],
      })
    })

    async function completeOneRun() {
      render(<ImportV1Dialog open onOpenChange={onOpenChange} />)
      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "legacy-user" },
      })
      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret" },
      })
      fireEvent.click(screen.getByTestId("v1-import-submit"))
      await screen.findByTestId("v1-import-result")
    }

    it("disables the submit control while a submission is in flight", () => {
      render(<ImportV1Dialog open onOpenChange={onOpenChange} />)
      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "legacy-user" },
      })
      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret" },
      })
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
    })

    it("disables the submit control immediately after a completed run (1.2/2.2)", async () => {
      await completeOneRun()

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
      expect(screen.getByTestId("v1-import-password")).toHaveValue("")
    })

    it("states that the run finished and the password must be re-entered (3.1)", async () => {
      await completeOneRun()

      expect(screen.getByTestId("v1-import-rerun-hint")).toHaveTextContent(
        "goals.v1Import.rerunRequiresPassword"
      )
    })

    it("presents an empty password field after a completed run (3.3)", async () => {
      await completeOneRun()

      expect(screen.getByTestId("v1-import-password")).toHaveValue("")
    })

    it("re-runs a second import once the password is re-entered, replacing the previous result (1.1/3.2)", async () => {
      await completeOneRun()
      expect(importV1Profile).toHaveBeenCalledTimes(1)

      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret-again" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      importV1Profile.mockReset().mockResolvedValue({
        personalTacticusApiKey: { status: "Skipped" },
        tacticusUserId: { status: "Imported" },
        guildApiToken: { status: "Imported" },
        onslaughtProgress: { status: "Imported" },
        campaignEventProgress: { status: "Imported" },
        goals: { status: "Skipped" },
        goalSpecs: [],
        goalsSkipped: 0,
        goalIssues: [],
      })
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await waitFor(() => {
        expect(importV1Profile).toHaveBeenCalledTimes(1)
      })
      expect(importV1Profile).toHaveBeenCalledWith(
        expect.objectContaining({ password: "secret-again" }),
        expect.anything()
      )
      expect(await screen.findByTestId("v1-import-result")).toHaveTextContent(
        "Skipped"
      )
    })

    it("keeps the submit control unavailable for an empty or whitespace-only username (2.4)", () => {
      render(<ImportV1Dialog open onOpenChange={onOpenChange} />)
      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret" },
      })

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "   " },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "legacy-user" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()
    })

    it("keeps the submit control unavailable without a selected part or a password", () => {
      render(<ImportV1Dialog open onOpenChange={onOpenChange} />)
      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "legacy-user" },
      })
      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      for (const [key] of [
        ["personalTacticusApiKey"],
        ["tacticusUserId"],
        ["guildApiToken"],
        ["goals"],
        ["onslaughtProgress"],
        ["campaignEventProgress"],
      ] as const) {
        fireEvent.click(screen.getByTestId(`v1-import-${key}`))
      }
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.click(screen.getByTestId("v1-import-goals"))
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
    })
  })
})
