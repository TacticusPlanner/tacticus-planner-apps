import { fireEvent, render, screen } from "@testing-library/react"
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

describe("LandingPage", () => {
  it("renders the combined sign-in button and starts the login redirect on click", () => {
    render(<LandingPage />)

    const button = screen.getByTestId("landing-get-started")
    expect(button).toBeVisible()

    fireEvent.click(button)
    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
  })
})
