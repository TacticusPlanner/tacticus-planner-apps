import { render as rtlRender, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("./account-menu-parts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./account-menu-parts")>()),
  PreferencesSection: () => <section aria-label="auth.preferences" />,
}))

import { GuestPreferencesCard } from "./guest-account-menu"

function render(ui: ReactElement) {
  return rtlRender(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("GuestPreferencesCard", () => {
  it("shows the Changelog row when the caller can open the widget", () => {
    render(<GuestPreferencesCard onChangelog={() => {}} />)

    expect(
      screen.getByRole("button", { name: "feedback.changelog" })
    ).toBeVisible()
    expect(screen.getByRole("link", { name: /feedback.roadmap/ })).toBeVisible()
  })

  it("omits the Changelog row without a widget to open", () => {
    render(<GuestPreferencesCard />)

    expect(
      screen.queryByRole("button", { name: "feedback.changelog" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /feedback.roadmap/ })).toBeVisible()
  })

  it("links the privacy and terms pages", () => {
    render(<GuestPreferencesCard />)

    expect(
      screen.getByRole("link", { name: "publicSite.privacy" })
    ).toHaveAttribute("href", "/privacy")
    expect(
      screen.getByRole("link", { name: "publicSite.terms" })
    ).toHaveAttribute("href", "/terms")
  })
})
