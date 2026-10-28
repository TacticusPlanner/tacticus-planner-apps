import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, options?: { date?: string }) =>
      options?.date ? `${key} ${options.date}` : key,
  }),
}))

vi.mock("@/shared/config", () => ({
  DISCORD_INVITE_URL: "https://discord.example",
  GITHUB_ORG_URL: "https://github.example",
}))

import { PrivacyPage } from "./privacy-page"

describe("PrivacyPage", () => {
  it("renders the notice with its last-updated date", () => {
    render(<PrivacyPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "title" })
    ).toBeVisible()
    expect(screen.getByText("lastUpdated October 28, 2026")).toBeVisible()
  })

  it("covers every required topic in order", () => {
    render(<PrivacyPage />)

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "sections.signIn.title",
      "sections.apiKey.title",
      "sections.plannerData.title",
      "sections.analytics.title",
      "sections.feedback.title",
      "sections.noSale.title",
      "sections.deletion.title",
      "sections.contact.title",
    ])
  })

  it("links the contact channels", () => {
    render(<PrivacyPage />)

    expect(
      screen.getByRole("link", { name: "common:publicSite.discord" })
    ).toHaveAttribute("href", "https://discord.example")
    expect(
      screen.getByRole("link", { name: "common:publicSite.github" })
    ).toHaveAttribute("href", "https://github.example")
  })
})
