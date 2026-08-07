import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

const loginRedirect = vi.fn().mockResolvedValue(undefined)
const isUiKitEnabled = vi.fn(() => true)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    inProgress: InteractionStatus.None,
    instance: { loginRedirect },
  }),
}))

const silentSignInStatus = vi.fn(() => "idle")

vi.mock("@/shared/auth", () => ({
  loginRequest: { scopes: ["api"] },
  useSilentSignInStatus: () => silentSignInStatus(),
}))

// The real module re-exports `@/shared/config`'s i18n setup, which calls `initReactI18next` at
// import time — incompatible with the plain `useTranslation` mock above (see auth-control.test.tsx
// for the same issue). Only `isUiKitEnabled`'s value is used by the component under test.
vi.mock("@/shared/config", () => ({
  get isUiKitEnabled() {
    return isUiKitEnabled()
  },
}))

import { LandingPage } from "./landing-page"

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe("LandingPage", () => {
  beforeEach(() => {
    silentSignInStatus.mockReturnValue("idle")
    loginRedirect.mockClear().mockResolvedValue(undefined)
  })

  it("renders the combined sign-in button and starts the login redirect on click", () => {
    renderLanding()

    const button = screen.getByTestId("landing-get-started")
    expect(button).toBeVisible()

    fireEvent.click(button)
    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
  })

  it("shows a 'checking' label while a silent restore is in progress, and still signs in manually on click", () => {
    silentSignInStatus.mockReturnValue("checking")
    renderLanding()

    const button = screen.getByTestId("landing-get-started")
    expect(button).toHaveTextContent("common:auth.checkingSignIn")

    fireEvent.click(button)
    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
  })

  it("links to the public Unit Lookup page", () => {
    renderLanding()

    const link = screen.getByTestId("landing-unit-lookup-link")
    expect(link).toHaveAttribute("href", "/lookup")
  })

  it("links to the UI Kit when enabled for this environment", () => {
    isUiKitEnabled.mockReturnValue(true)
    renderLanding()

    const link = screen.getByTestId("landing-ui-kit-link")
    expect(link).toHaveAttribute("href", "/ui-kit")
  })

  it("hides the UI Kit link when disabled for this environment (e.g. production)", () => {
    isUiKitEnabled.mockReturnValue(false)
    renderLanding()

    expect(screen.queryByTestId("landing-ui-kit-link")).not.toBeInTheDocument()
  })
})
