import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("./account-menu-parts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./account-menu-parts")>()),
  PreferencesSection: () => <section aria-label="auth.preferences" />,
}))

import { GuestPreferencesCard } from "./guest-account-menu"

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
})
