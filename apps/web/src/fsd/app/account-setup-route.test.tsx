import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import type { CurrentUserState } from "@/entities/account"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const refetch = vi.fn()
let currentUserState: CurrentUserState

vi.mock("@/entities/account", () => ({
  useCurrentUser: () => ({ refetch, state: currentUserState }),
  updateTacticusIntegration: vi.fn(),
}))

vi.mock("@/shared/auth", () => ({
  signOut: vi.fn(),
  useActiveAccountId: () => "home-account-1",
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: {} }),
}))

// The import step's own content (`SetupV1Import`) composes the full `V1ImportPanel` — its mutation,
// query-invalidation, and outcome-report behavior belong to `setup-v1-import.test.tsx` and
// `v1-import-panel.test.tsx`. Stubbing it here keeps this file's scope to routing and the reverse
// guard, matching how `account-setup-screen.test.tsx` stubs `renderImportStep`.
vi.mock("./setup-v1-import", () => ({
  SetupV1Import: ({
    onCompleted,
    onUseApiKey,
  }: {
    onCompleted: () => void
    onUseApiKey: () => void
  }) => (
    <div data-testid="stub-setup-v1-import">
      <button
        data-testid="stub-setup-v1-complete"
        onClick={onCompleted}
        type="button"
      >
        complete
      </button>
      <button
        data-testid="stub-setup-v1-use-api-key"
        onClick={onUseApiKey}
        type="button"
      >
        use api key
      </button>
    </div>
  ),
}))

import { AccountSetupRoute } from "./account-setup-route"
import { accountSetupRoutes } from "./account-setup-routes"

const baseUser = {
  applicationUserId: "user-1",
  displayName: "Test User",
  tacticusApiKeyMasked: null,
  tacticusUserIdMasked: null,
  analyticsId: "analytics-1",
}

const unconfigured: CurrentUserState = {
  status: "success",
  user: { ...baseUser, hasCompletedOnboarding: false },
}

const configured: CurrentUserState = {
  status: "success",
  user: { ...baseUser, hasCompletedOnboarding: true },
}

function Probe() {
  const location = useLocation()
  return (
    <div data-testid="probe">{`${location.pathname}${location.search}`}</div>
  )
}

function renderAt(initialPath: string) {
  // A factory, not a stored element: re-rendering the identical element reference makes React bail
  // out, so a rerender would not pick up a changed account state. MemoryRouter keeps its own
  // history across re-renders, so rebuilding the tree does not reset navigation.
  const build = () => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {accountSetupRoutes.map(({ path, step }) => (
          <Route
            element={<AccountSetupRoute step={step} />}
            key={path}
            path={path}
          />
        ))}
        <Route element={<Probe />} path="*" />
      </Routes>
    </MemoryRouter>
  )
  return { ...render(build()), build }
}

describe("accountSetupRoutes", () => {
  it("gives every step its own address", () => {
    expect(accountSetupRoutes).toEqual([
      { path: "/setup", step: "choose" },
      { path: "/setup/key", step: "key" },
      { path: "/setup/import", step: "import" },
    ])
  })
})

describe("AccountSetupRoute", () => {
  beforeEach(() => {
    currentUserState = unconfigured
    refetch.mockReset()
  })

  it.each([
    ["/setup", "account-setup-choice"],
    ["/setup/key", "account-setup-api-key-input"],
    ["/setup/import", "stub-setup-v1-import"],
  ])("renders the step for %s", (path, testId) => {
    renderAt(path)
    expect(screen.getByTestId(testId)).toBeVisible()
  })

  describe("reverse guard", () => {
    it("sends a configured user to the remembered destination", () => {
      currentUserState = configured

      renderAt("/setup?next=%2Fguild%2Fmembers")

      expect(screen.getByTestId("probe")).toHaveTextContent("/guild/members")
    })

    it("falls back to the default destination for a crafted next value", () => {
      currentUserState = configured

      renderAt("/setup?next=https%3A%2F%2Fevil.example")

      expect(screen.getByTestId("probe")).toHaveTextContent("/home")
    })

    it.each([
      ["loading", { status: "loading" } as CurrentUserState],
      [
        "errored",
        { status: "error", error: new Error("offline") } as CurrentUserState,
      ],
    ])("does not navigate while the account state is %s", (_label, state) => {
      currentUserState = state

      renderAt("/setup")

      // Pairing with OnboardingGate's identical rule is what stops the two guards ping-ponging.
      expect(screen.queryByTestId("probe")).not.toBeInTheDocument()
      expect(screen.getByTestId("account-setup-choice")).toBeVisible()
    })

    it("does not navigate away from the import step just because the account state reports provisioned, until Continue is clicked", () => {
      // The personal key is saved on the *first* submit, well before Continue ever appears — the
      // account state can genuinely report "provisioned" while the user is still reading the
      // import step's own report. Regressing this back to an immediate redirect is exactly the bug
      // this guards against: verified live that some other concurrently-mounted useCurrentUser()
      // subscriber (this route's own, the screen's, PostHogIdentity's analytics identity effect)
      // can refetch this same shared, staleTime:0 query on its own timing, independent of anything
      // the import step itself does.
      const { build, rerender } = renderAt(
        "/setup/import?next=%2Fguild%2Fmembers"
      )
      expect(screen.getByTestId("stub-setup-v1-import")).toBeVisible()

      currentUserState = configured
      rerender(build())

      expect(screen.getByTestId("stub-setup-v1-import")).toBeVisible()
      expect(screen.queryByTestId("probe")).not.toBeInTheDocument()
    })
  })

  describe("step navigation", () => {
    it("carries the remembered destination between steps", async () => {
      const user = userEvent.setup()
      renderAt("/setup?next=%2Fguild%2Fmembers")

      await user.click(screen.getByTestId("account-setup-choose-key"))

      expect(
        await screen.findByTestId("account-setup-api-key-input")
      ).toBeVisible()
      await user.click(screen.getByTestId("account-setup-back"))
      expect(await screen.findByTestId("account-setup-choice")).toBeVisible()

      // Still remembered after a round trip through both steps.
      currentUserState = configured
      await user.click(screen.getByTestId("account-setup-choose-import"))
      await waitFor(() =>
        expect(screen.getByTestId("probe")).toHaveTextContent("/guild/members")
      )
    })

    it("discards entered values when a step is left and re-entered", async () => {
      const user = userEvent.setup()
      renderAt("/setup/key")

      await user.type(
        screen.getByTestId("account-setup-api-key-input"),
        "typed"
      )
      await user.click(screen.getByTestId("account-setup-back"))
      await screen.findByTestId("account-setup-choice")
      await user.click(screen.getByTestId("account-setup-choose-key"))

      expect(
        await screen.findByTestId("account-setup-api-key-input")
      ).toHaveValue("")
    })

    it("sends the import step's 'use an API key instead' shortcut to the key step", async () => {
      const user = userEvent.setup()
      renderAt("/setup/import")

      await user.click(screen.getByTestId("stub-setup-v1-use-api-key"))

      expect(
        await screen.findByTestId("account-setup-api-key-input")
      ).toBeVisible()
    })
  })

  describe("completion", () => {
    it("navigates only once the refreshed account state confirms the key", async () => {
      const user = userEvent.setup()
      const { build, rerender } = renderAt("/setup/key?next=%2Fguild%2Fmembers")

      await user.type(screen.getByTestId("account-setup-api-key-input"), "k")
      await user.click(screen.getByTestId("account-setup-api-key-submit"))
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))

      // The refetch is fire-and-forget and react-query keeps serving the previous value, so the
      // account state still reports onboarding incomplete here. Navigating now would land on a
      // route whose gate reads that same stale value and bounce the user back to an empty form.
      expect(screen.queryByTestId("probe")).not.toBeInTheDocument()
      expect(screen.getByTestId("account-setup-confirming")).toBeVisible()

      currentUserState = configured
      rerender(build())

      await waitFor(() =>
        expect(screen.getByTestId("probe")).toHaveTextContent("/guild/members")
      )
    })

    it("navigates once the import step signals its own completion", async () => {
      const user = userEvent.setup()
      const { build, rerender } = renderAt(
        "/setup/import?next=%2Fguild%2Fmembers"
      )

      await user.click(screen.getByTestId("stub-setup-v1-complete"))
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))

      expect(screen.getByTestId("account-setup-confirming")).toBeVisible()

      currentUserState = configured
      rerender(build())

      await waitFor(() =>
        expect(screen.getByTestId("probe")).toHaveTextContent("/guild/members")
      )
    })
  })
})
