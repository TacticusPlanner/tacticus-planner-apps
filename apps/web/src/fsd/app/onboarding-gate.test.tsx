import { render, screen } from "@testing-library/react"
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
}))

import { OnboardingGate } from "./onboarding-gate"

function setState(state: CurrentUserState) {
  useCurrentUser.mockReturnValue({ refetch: vi.fn(), state })
}

const configuredUser = {
  applicationUserId: "user-1",
  displayName: "Test User",
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

  it("fails open without navigating if the current-user fetch errored", () => {
    setState({ status: "error", error: new Error("boom") })

    renderAt("/guild/members")

    // Navigating here would bounce against the setup route's own guard, which also refuses to act
    // on an indeterminate account state.
    expect(screen.getByTestId("protected-content")).toBeVisible()
    expect(screen.queryByTestId("setup-probe")).not.toBeInTheDocument()
  })
})
