import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()

vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
  useGoalRefresh: () => ({
    revision: 0,
    refreshGoals: vi.fn(),
    registerGoalRefetch: vi.fn(() => () => undefined),
  }),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { useGoalActions } from "../model/use-goal-actions"
import { GoalRowActions } from "./goal-row-actions"

function Harness({ onChanged }: { onChanged: () => void }) {
  const actions = useGoalActions(onChanged)
  return <GoalRowActions actions={actions} goalId="goal-1" status="Active" />
}

describe("GoalRowActions", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset()
    deleteGoal.mockReset()
  })

  it("pauses an active goal and refreshes", async () => {
    updateGoalStatus.mockResolvedValue({})
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChanged={onChanged} />)

    await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))
    await user.click(await screen.findByText("goals.actions.pause"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "goal-1",
        "Paused"
      )
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it("opens the confirm dialog and deletes on confirm", async () => {
    deleteGoal.mockResolvedValue(undefined)
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChanged={onChanged} />)

    await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))
    await user.click(await screen.findByTestId("goal-row-delete-goal-1"))

    expect(await screen.findByTestId("delete-goal-dialog")).toBeInTheDocument()

    await user.click(screen.getByTestId("delete-goal-confirm"))

    await vi.waitFor(() => {
      expect(deleteGoal).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "goal-1"
      )
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it("surfaces an error toast when the mutation fails", async () => {
    updateGoalStatus.mockRejectedValue(new Error("boom"))
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChanged={onChanged} />)

    await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))
    await user.click(await screen.findByText("goals.actions.pause"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalled()
    })
    expect(onChanged).not.toHaveBeenCalled()
  })
})
