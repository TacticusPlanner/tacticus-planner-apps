import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import type { CurrentUserState } from "@/entities/account"

import type { AccountSetupStep } from "./account-setup-screen"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

const refetch = vi.fn()
const updateTacticusIntegration = vi.fn()
let currentUserState: CurrentUserState

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  useCurrentUser: () => ({ refetch, state: currentUserState }),
  useUpdateDisplayName: () => ({ isPending: false, mutateAsync: vi.fn() }),
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
}))

import { AccountSetupScreen } from "./account-setup-screen"

const unconfiguredState: CurrentUserState = {
  status: "success",
  user: {
    applicationUserId: "user-1",
    displayName: null,
    suggestedDisplayName: "Suggested Name",
    hasCompletedOnboarding: false,
    tacticusApiKeyMasked: null,
    tacticusUserIdMasked: null,
    analyticsId: "analytics-1",
  },
}

function renderScreen(
  step: AccountSetupStep = "choose",
  suggestedDisplayName?: string
) {
  const onStepChange = vi.fn()
  const renderImportStep = vi.fn(
    (onCompleted: () => void, onKeyImported: () => void) => (
      <div>
        <button
          data-testid="stub-import-step"
          onClick={onCompleted}
          type="button"
        >
          stub import step
        </button>
        <button
          data-testid="stub-import-key-imported"
          onClick={onKeyImported}
          type="button"
        >
          stub key imported
        </button>
      </div>
    )
  )
  const result = render(
    <AccountSetupScreen
      onStepChange={onStepChange}
      renderImportStep={renderImportStep}
      step={step}
      suggestedDisplayName={suggestedDisplayName}
    />
  )
  return { ...result, onStepChange, renderImportStep }
}

describe("AccountSetupScreen", () => {
  beforeEach(() => {
    currentUserState = unconfiguredState
    refetch.mockReset()
    updateTacticusIntegration.mockReset()
  })

  it("renders as page content rather than a modal", () => {
    renderScreen()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible()
  })

  it("offers a choice and shows no fields on the first step", () => {
    renderScreen()

    expect(screen.getByTestId("account-setup-choice")).toBeVisible()
    expect(
      screen.queryByTestId("account-setup-api-key-input")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("stub-import-step")).not.toBeInTheDocument()
  })

  it("shows the key step's fields and not the import step's content", () => {
    renderScreen("key")

    expect(screen.getByTestId("account-setup-api-key-input")).toBeVisible()
    expect(screen.queryByTestId("stub-import-step")).not.toBeInTheDocument()
    expect(screen.getByTestId("account-setup-back")).toBeVisible()
  })

  it("renders the import step through renderImportStep, not its own UI", () => {
    const { renderImportStep } = renderScreen("import")

    expect(renderImportStep).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("stub-import-step")).toBeVisible()
    expect(
      screen.queryByTestId("account-setup-api-key-input")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("account-setup-back")).toBeVisible()
  })

  it("hides Back once the import step reports the key is in — going back no longer makes sense", async () => {
    const user = userEvent.setup()
    renderScreen("import")
    expect(screen.getByTestId("account-setup-back")).toBeVisible()

    await user.click(screen.getByTestId("stub-import-key-imported"))

    expect(screen.queryByTestId("account-setup-back")).not.toBeInTheDocument()
  })

  it("reports the user's position in the three-step flow", () => {
    renderScreen("import")

    expect(screen.getByTestId("account-setup-step-position")).toHaveTextContent(
      '{"current":2,"total":3}'
    )

    renderScreen("name")

    expect(
      screen.getAllByTestId("account-setup-step-position")[1]
    ).toHaveTextContent('{"current":3,"total":3}')
  })

  it("shows the name step with the account's private suggestion and no Back control", () => {
    renderScreen("name")

    expect(screen.getByTestId("account-setup-name-input")).toHaveValue(
      "Suggested Name"
    )
    expect(screen.queryByTestId("account-setup-back")).not.toBeInTheDocument()
  })

  it("prefers a V1 import suggestion over the account's own", () => {
    renderScreen("name", "Ragnar42")

    expect(screen.getByTestId("account-setup-name-input")).toHaveValue(
      "Ragnar42"
    )
  })

  it.each(["choose", "key", "import"] as const)(
    "asks to leave the %s step through the step handler, not local state",
    async (step) => {
      const user = userEvent.setup()
      const { onStepChange } = renderScreen(step)

      if (step === "choose") {
        await user.click(screen.getByTestId("account-setup-choose-import"))
        expect(onStepChange).toHaveBeenCalledWith("import")
      } else {
        await user.click(screen.getByTestId("account-setup-back"))
        expect(onStepChange).toHaveBeenCalledWith("choose")
      }
    }
  )

  describe("completion handover", () => {
    it("refreshes the account state and shows progress instead of navigating", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      renderScreen("key")

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))

      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))
      expect(screen.getByTestId("account-setup-confirming")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-api-key-input")
      ).not.toBeInTheDocument()
    })

    it("hands control back on the import step's own completion signal", async () => {
      const user = userEvent.setup()
      renderScreen("import")

      await user.click(screen.getByTestId("stub-import-step"))

      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))
      expect(screen.getByTestId("account-setup-confirming")).toBeVisible()
    })

    it("keeps the forms hidden even if the confirmation refetch fails, so a retry cannot race a second submission", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      const { onStepChange, rerender, renderImportStep } = renderScreen("key")

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))
      await waitFor(() => expect(refetch).toHaveBeenCalled())

      currentUserState = { status: "error", error: new Error("offline") }
      rerender(
        <AccountSetupScreen
          onStepChange={onStepChange}
          renderImportStep={renderImportStep}
          step="choose"
        />
      )

      expect(screen.getByTestId("account-setup-confirm-failed")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-choice")
      ).not.toBeInTheDocument()
    })

    it("offers a retry when the account state cannot be refreshed afterwards", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      const { onStepChange, rerender, renderImportStep } = renderScreen("key")

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))
      await waitFor(() => expect(refetch).toHaveBeenCalled())

      // The route guard refuses to navigate on an indeterminate account state, so without this the
      // user would sit behind a spinner that never resolves.
      currentUserState = { status: "error", error: new Error("offline") }
      rerender(
        <AccountSetupScreen
          onStepChange={onStepChange}
          renderImportStep={renderImportStep}
          step="choose"
        />
      )

      expect(screen.getByTestId("account-setup-confirm-failed")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-confirming")
      ).not.toBeInTheDocument()

      await user.click(screen.getByTestId("account-setup-confirm-retry"))
      expect(refetch).toHaveBeenCalledTimes(2)
    })
  })
})
