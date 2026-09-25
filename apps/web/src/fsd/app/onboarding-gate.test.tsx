import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"

const useCurrentUser =
  vi.fn<() => { refetch: () => void; state: CurrentUserState }>()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/account", () => ({
  useCurrentUser: () => useCurrentUser(),
  isAccountSetupComplete: (user: {
    hasCompletedOnboarding: boolean
    displayName: string | null
  }) => user.hasCompletedOnboarding && user.displayName !== null,
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

import { OnboardingGate } from "./onboarding-gate"

function setState(state: CurrentUserState) {
  useCurrentUser.mockReturnValue({ refetch: vi.fn(), state })
}

const configuredUser = {
  applicationUserId: "user-1",
  displayName: "Test User",
  suggestedDisplayName: null,
  hasCompletedOnboarding: true,
  tacticusApiKeyMasked: "••••••••abcd",
  tacticusUserIdMasked: null,
  analyticsId: "analytics-id-1",
}

const unconfiguredUser = {
  ...configuredUser,
  hasCompletedOnboarding: false,
  tacticusApiKeyMasked: null,
}

// Reports where the gate sent us, so a redirect is asserted by destination rather than by mocking
// the router's navigation.
function SetupProbe() {
  const location = useLocation()
  return (
    <div data-testid="setup-probe">{`${location.pathname}${location.search}`}</div>
  )
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<SetupProbe />} path="/setup" />
        <Route element={<SetupProbe />} path="/setup/name" />
        <Route
          element={
            <OnboardingGate>
              <div data-testid="protected-content" />
            </OnboardingGate>
          }
          path="*"
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("OnboardingGate", () => {
  it("sends an unconfigured user to setup, remembering where they were headed", () => {
    setState({ status: "success", user: unconfiguredUser })

    renderAt("/guild/members?tab=roster")

    expect(screen.getByTestId("setup-probe")).toHaveTextContent(
      "/setup?next=%2Fguild%2Fmembers%3Ftab%3Droster"
    )
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
  })

  it("sends a user with a key but no confirmed name straight to the name step", () => {
    setState({
      status: "success",
      user: {
        ...configuredUser,
        displayName: null,
        suggestedDisplayName: "Provider Name",
      },
    })

    renderAt("/guild/members")

    expect(screen.getByTestId("setup-probe")).toHaveTextContent(
      "/setup/name?next=%2Fguild%2Fmembers"
    )
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
  })

  it("reveals protected content once onboarding is complete", () => {
    setState({ status: "success", user: configuredUser })

    renderAt("/guild/members")

    expect(screen.getByTestId("protected-content")).toBeVisible()
    expect(screen.queryByTestId("setup-probe")).not.toBeInTheDocument()
  })

  it("blocks protected content while the current user is still provisioning, without navigating", () => {
    setState({ status: "loading" })

    renderAt("/guild/members")

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
    expect(screen.queryByTestId("setup-probe")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toBeVisible()
  })

  it("blocks protected content without navigating if the current-user fetch errored", () => {
    setState({ status: "error", error: new Error("boom") })

    renderAt("/guild/members")

    // Navigating here would bounce against the setup route's own guard, which also refuses to act
    // on an indeterminate account state — but an indeterminate state must not read as "onboarded"
    // either, so protected content stays hidden behind a retry instead of failing open.
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
    expect(screen.queryByTestId("setup-probe")).not.toBeInTheDocument()
    expect(screen.getByTestId("account-gate-retry")).toBeVisible()
  })

  it("retries the current-user fetch from the error state", async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    useCurrentUser.mockReturnValue({
      refetch,
      state: { status: "error", error: new Error("boom") },
    })

    renderAt("/guild/members")
    await user.click(screen.getByTestId("account-gate-retry"))

    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
