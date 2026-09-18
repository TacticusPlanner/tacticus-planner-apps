import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import type { CurrentUserState } from "@/entities/account"

import type { AccountSetupStep } from "./account-setup-screen"

// The viewport is not observable in jsdom — `src/test/setup.ts` stubs `matchMedia` to
// `matches: false` for every query, so `useIsMobile()` would always report desktop and a test that
// merely set `window.innerWidth` would silently assert the wrong tree. Drive the hook directly,
// following `entities/project/ui/project-select.test.tsx`.
const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

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

vi.mock("@/entities/account", () => ({
  useCurrentUser: () => ({ refetch, state: currentUserState }),
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
  importV1Profile: vi.fn(),
}))

const signOut = vi.fn<(instance: unknown, accountId: string) => Promise<void>>(
  () => Promise.resolve()
)

vi.mock("@/shared/auth", () => ({
  signOut: (instance: unknown, accountId: string) =>
    signOut(instance, accountId),
  useActiveAccountId: () => "home-account-1",
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: { id: "msal-instance" } }),
}))

import { AccountSetupScreen } from "./account-setup-screen"

const unconfiguredState: CurrentUserState = {
  status: "success",
  user: {
    applicationUserId: "user-1",
    displayName: "Test User",
    hasCompletedOnboarding: false,
    tacticusApiKeyMasked: null,
    tacticusUserIdMasked: null,
    analyticsId: "analytics-1",
  },
}

function renderScreen(step: AccountSetupStep = "choose") {
  const onStepChange = vi.fn()
  const result = render(
    <AccountSetupScreen onStepChange={onStepChange} step={step} />
  )
  return { ...result, onStepChange }
}

describe("AccountSetupScreen", () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false)
    currentUserState = unconfiguredState
    refetch.mockReset()
    signOut.mockClear()
    updateTacticusIntegration.mockReset()
  })

  it("renders as page content rather than a modal", () => {
    renderScreen()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible()
  })

  describe("desktop", () => {
    it("shows both paths at once, with no choice step or back control", () => {
      renderScreen()

      expect(screen.getByTestId("account-setup-panels")).toBeVisible()
      expect(screen.getByTestId("account-setup-api-key-input")).toBeVisible()
      expect(
        screen.getByTestId("account-setup-v1-username-input")
      ).toBeVisible()
      expect(screen.queryByTestId("account-setup-back")).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("account-setup-choice")
      ).not.toBeInTheDocument()
    })

    it("shows the two-panel screen at a per-step address, without redirecting", () => {
      renderScreen("key")

      expect(screen.getByTestId("account-setup-panels")).toBeVisible()
      expect(
        screen.getByTestId("account-setup-v1-username-input")
      ).toBeVisible()
    })

    it("does not show the mobile step position indicator", () => {
      renderScreen()

      expect(
        screen.queryByTestId("account-setup-step-position")
      ).not.toBeInTheDocument()
    })
  })

  describe("mobile", () => {
    beforeEach(() => {
      useIsMobileMock.mockReturnValue(true)
    })

    it("offers a choice and shows no fields on the first step", () => {
      renderScreen()

      expect(screen.getByTestId("account-setup-choice")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-api-key-input")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("account-setup-v1-username-input")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("account-setup-panels")
      ).not.toBeInTheDocument()
    })

    it.each([
      ["key", "account-setup-api-key-input", "account-setup-v1-username-input"],
      [
        "import",
        "account-setup-v1-username-input",
        "account-setup-api-key-input",
      ],
    ] as const)(
      "shows only the %s path's fields on its step",
      (step, present, absent) => {
        renderScreen(step)

        expect(screen.getByTestId(present)).toBeVisible()
        expect(screen.queryByTestId(absent)).not.toBeInTheDocument()
        expect(screen.getByTestId("account-setup-back")).toBeVisible()
      }
    )

    it("reports the user's position in the two-step flow", () => {
      renderScreen("import")

      expect(
        screen.getByTestId("account-setup-step-position")
      ).toHaveTextContent('{"current":2,"total":2}')
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
  })

  describe("sign out", () => {
    it("is offered on the desktop layout", () => {
      renderScreen()
      expect(screen.getByTestId("account-setup-sign-out")).toBeVisible()
    })

    it.each(["choose", "key", "import"] as const)(
      "is offered on the mobile %s step",
      (step) => {
        useIsMobileMock.mockReturnValue(true)
        renderScreen(step)
        expect(screen.getByTestId("account-setup-sign-out")).toBeVisible()
      }
    )

    it("signs the user out with the active account", async () => {
      const user = userEvent.setup()
      renderScreen()

      await user.click(screen.getByTestId("account-setup-sign-out"))

      expect(signOut).toHaveBeenCalledWith(
        { id: "msal-instance" },
        "home-account-1"
      )
    })
  })

  describe("completion handover", () => {
    it("refreshes the account state and shows progress instead of navigating", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      renderScreen()

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))

      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))
      expect(screen.getByTestId("account-setup-confirming")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-panels")
      ).not.toBeInTheDocument()
    })

    it("keeps the forms hidden even if the confirmation refetch fails, so a retry cannot race a second submission", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      const { onStepChange, rerender } = renderScreen()

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))
      await waitFor(() => expect(refetch).toHaveBeenCalled())

      currentUserState = { status: "error", error: new Error("offline") }
      rerender(<AccountSetupScreen onStepChange={onStepChange} step="choose" />)

      expect(screen.getByTestId("account-setup-confirm-failed")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-panels")
      ).not.toBeInTheDocument()
    })

    it("offers a retry when the account state cannot be refreshed afterwards", async () => {
      updateTacticusIntegration.mockResolvedValue({})
      const user = userEvent.setup()
      const { onStepChange, rerender } = renderScreen()

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "key-1"
      )
      await user.click(screen.getByTestId("account-setup-api-key-submit"))
      await waitFor(() => expect(refetch).toHaveBeenCalled())

      // The route guard refuses to navigate on an indeterminate account state, so without this the
      // user would sit behind a spinner that never resolves.
      currentUserState = { status: "error", error: new Error("offline") }
      rerender(<AccountSetupScreen onStepChange={onStepChange} step="choose" />)

      expect(screen.getByTestId("account-setup-confirm-failed")).toBeVisible()
      expect(
        screen.queryByTestId("account-setup-confirming")
      ).not.toBeInTheDocument()

      await user.click(screen.getByTestId("account-setup-confirm-retry"))
      expect(refetch).toHaveBeenCalledTimes(2)
    })
  })
})
