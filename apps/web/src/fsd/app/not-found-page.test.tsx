import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@testing-library/react"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { NotFoundPage } from "./not-found-page"

function renderPage(isAuthenticated: boolean) {
  return render(
    <MemoryRouter>
      <NotFoundPage isAuthenticated={isAuthenticated} />
    </MemoryRouter>
  )
}

describe("NotFoundPage", () => {
  it("says the address is not a page", () => {
    renderPage(false)

    expect(
      screen.getByRole("heading", { name: "notFound.title" })
    ).toBeInTheDocument()
    expect(screen.getByText("notFound.description")).toBeInTheDocument()
  })

  it("offers a guest the Library and the start page", () => {
    renderPage(false)

    expect(
      screen.getByRole("link", { name: "notFound.browseLibrary" })
    ).toHaveAttribute("href", "/library/characters")
    expect(
      screen.getByRole("link", { name: "notFound.goToStart" })
    ).toHaveAttribute("href", "/")
    expect(
      screen.queryByRole("link", { name: "notFound.goHome" })
    ).not.toBeInTheDocument()
  })

  it("offers a signed-in user Home", () => {
    renderPage(true)

    expect(
      screen.getByRole("link", { name: "notFound.goHome" })
    ).toHaveAttribute("href", "/home")
  })
})
