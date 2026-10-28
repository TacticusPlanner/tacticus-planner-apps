import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/shared/ui", () => ({
  LegalDocument: ({
    sections,
    title,
  }: {
    sections: { id: string; title: string }[]
    title: string
  }) => (
    <div>
      <h1>{title}</h1>
      {sections.map((section) => (
        <h2 key={section.id}>{section.title}</h2>
      ))}
    </div>
  ),
}))

import { TermsPage } from "./terms-page"

describe("TermsPage", () => {
  it("covers every term in order", () => {
    render(<TermsPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "title" })
    ).toBeVisible()
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "sections.fanProject.title",
      "sections.account.title",
      "sections.acceptableUse.title",
      "sections.gameContent.title",
      "sections.openSource.title",
      "sections.noWarranty.title",
      "sections.availability.title",
      "sections.changes.title",
      "sections.contact.title",
    ])
  })
})
