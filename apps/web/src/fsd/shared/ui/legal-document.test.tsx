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

import { LegalDocument } from "./legal-document"

function renderDocument() {
  render(
    <LegalDocument
      idPrefix="doc"
      intro="Intro"
      lastUpdated={new Date(Date.UTC(2026, 9, 28))}
      sections={[
        { id: "first", title: "First", body: "First body" },
        { id: "second", title: "Second", body: "Second body" },
      ]}
      title="Title"
    />
  )
}

describe("LegalDocument", () => {
  it("renders the title, last-updated date and intro", () => {
    renderDocument()

    expect(
      screen.getByRole("heading", { level: 1, name: "Title" })
    ).toBeVisible()
    expect(
      screen.getByText("publicSite.lastUpdated October 28, 2026")
    ).toBeVisible()
    expect(screen.getByText("Intro")).toBeVisible()
  })

  it("renders one labelled section per entry, in order", () => {
    renderDocument()

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual(["First", "Second"])
    expect(screen.getByRole("region", { name: "First" })).toHaveTextContent(
      "First body"
    )
  })

  it("links the contact channels", () => {
    renderDocument()

    expect(
      screen.getByRole("link", { name: "publicSite.discord" })
    ).toHaveAttribute("href", "https://discord.example")
    expect(
      screen.getByRole("link", { name: "publicSite.github" })
    ).toHaveAttribute("href", "https://github.example")
  })
})
