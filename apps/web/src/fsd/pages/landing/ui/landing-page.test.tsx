import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

const loginRedirect = vi.fn().mockResolvedValue(undefined)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    inProgress: InteractionStatus.None,
    instance: { loginRedirect },
  }),
}))

vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

import { LandingPage } from "./landing-page"

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe("LandingPage", () => {
  it("renders the combined sign-in button and starts the login redirect on click", () => {
    renderLanding()

    const button = screen.getByTestId("landing-get-started")
    expect(button).toBeVisible()

    fireEvent.click(button)
    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
  })

  it("links to the public Rank Lookup page", () => {
    renderLanding()

    const link = screen.getByTestId("landing-rank-lookup-link")
    expect(link).toHaveAttribute("href", "/lookup/ranks")
  })
})
