import { render, screen } from "@testing-library/react"
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

vi.mock("@/features/account-onboarding", () => ({
  OnboardingDialog: () => <div data-testid="onboarding-dialog-stub" />,
}))

import { OnboardingGate } from "./onboarding-gate"

function setState(state: CurrentUserState) {
  useCurrentUser.mockReturnValue({ refetch: vi.fn(), state })
}

describe("OnboardingGate", () => {
  it("blocks protected content with the onboarding dialog when the Tacticus API key is missing", () => {
    setState({
      status: "success",
      user: {
        applicationUserId: "user-1",
        displayName: "Test User",
        hasCompletedOnboarding: false,
        tacticusApiKeyMasked: null,
        tacticusUserIdMasked: null,
      },
    })

    render(
      <OnboardingGate>
        <div data-testid="protected-content" />
      </OnboardingGate>
    )

    expect(screen.getByTestId("onboarding-dialog-stub")).toBeVisible()
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
  })

  it("reveals protected content once onboarding is complete", () => {
    setState({
      status: "success",
      user: {
        applicationUserId: "user-1",
        displayName: "Test User",
        hasCompletedOnboarding: true,
        tacticusApiKeyMasked: "••••••••abcd",
        tacticusUserIdMasked: null,
      },
    })

    render(
      <OnboardingGate>
        <div data-testid="protected-content" />
      </OnboardingGate>
    )

    expect(
      screen.queryByTestId("onboarding-dialog-stub")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("protected-content")).toBeVisible()
  })

  it("does not block while the current user is still loading", () => {
    setState({ status: "loading" })

    render(
      <OnboardingGate>
        <div data-testid="protected-content" />
      </OnboardingGate>
    )

    expect(
      screen.queryByTestId("onboarding-dialog-stub")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("protected-content")).toBeVisible()
  })

  it("fails open (does not block) if the current-user fetch errored", () => {
    setState({ status: "error", error: new Error("boom") })

    render(
      <OnboardingGate>
        <div data-testid="protected-content" />
      </OnboardingGate>
    )

    expect(
      screen.queryByTestId("onboarding-dialog-stub")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("protected-content")).toBeVisible()
  })
})
