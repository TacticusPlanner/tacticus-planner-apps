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

vi.mock("@/entities/project", () => ({
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
  })
})
