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

import { PrivacyPage } from "./privacy-page"

describe("PrivacyPage", () => {
  it("covers every required topic in order", () => {
    render(<PrivacyPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "title" })
    ).toBeVisible()
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "sections.signIn.title",
      "sections.apiKey.title",
      "sections.plannerData.title",
      "sections.cookies.title",
      "sections.analytics.title",
      "sections.feedback.title",
      "sections.noSale.title",
      "sections.deletion.title",
      "sections.contact.title",
    ])
  })
})
