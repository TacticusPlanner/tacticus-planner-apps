import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signIn = vi.fn()
const signInState = vi.fn(() => ({ checkingSignIn: false, disabled: false }))
const isAuthenticated = vi.fn(() => false)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/shared/auth", () => ({
  useSignInRedirect: () => ({ ...signInState(), signIn }),
}))

vi.mock("@/features/account", () => ({
  useSignInAccountKeptNotice: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => isAuthenticated(),
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
    signIn.mockClear()
    signInState.mockReturnValue({ checkingSignIn: false, disabled: false })
    isAuthenticated.mockReturnValue(false)
  })

  it("has one level-1 headline", () => {
    renderLanding()

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(
      screen.getByRole("heading", { level: 1, name: "hero.title" })
    ).toBeVisible()
  })

  it("starts sign-in from the primary hero action", () => {
    renderLanding()

    fireEvent.click(screen.getByRole("button", { name: "hero.getStarted" }))

    expect(signIn).toHaveBeenCalledOnce()
  })

  it("shows the checking label while a silent restore runs", () => {
    signInState.mockReturnValue({ checkingSignIn: true, disabled: false })
    renderLanding()

    expect(
      screen.getByRole("button", { name: "common:auth.checkingSignIn" })
    ).toBeEnabled()
  })

  it("disables the primary action during an MSAL interaction", () => {
    signInState.mockReturnValue({ checkingSignIn: false, disabled: true })
    renderLanding()

    expect(
      screen.getByRole("button", { name: "hero.getStarted" })
    ).toBeDisabled()
  })

  it("offers a signed-in visitor the planner instead of sign-in", () => {
    isAuthenticated.mockReturnValue(true)
    renderLanding()

    expect(
      screen.getByRole("link", { name: "common:publicSite.openPlanner" })
    ).toHaveAttribute("href", "/home")
    expect(
      screen.queryByRole("button", { name: "hero.getStarted" })
    ).not.toBeInTheDocument()
  })

  it("links the secondary action to the Library", () => {
    renderLanding()

    expect(
      screen.getByRole("link", { name: "hero.browseLibrary" })
    ).toHaveAttribute("href", "/library/characters")
  })

  it("labels the example plan as an example", () => {
    renderLanding()

    const preview = screen.getByRole("figure", { name: "preview.title" })
    expect(within(preview).getAllByRole("listitem")).toHaveLength(3)
  })

  it("lists the four planning features in order", () => {
    renderLanding()

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent)
      .slice(0, 4)
    expect(titles).toEqual([
      "features.items.goals.title",
      "features.items.dailyRaids.title",
      "features.items.legendaryEvents.title",
      "features.items.guildRaids.title",
    ])
  })

  it("links every public Library collection", () => {
    renderLanding()

    const library = screen.getByTestId("landing-library")
    const hrefs = within(library)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
    expect(hrefs).toEqual([
      "/library/characters",
      "/library/raid-bosses",
      "/library/shops",
      "/library/machines-of-war",
      "/library/npcs",
    ])
  })

  it("keeps all game art decorative", () => {
    const { container } = renderLanding()

    const images = container.querySelectorAll("img")
    expect(images.length).toBeGreaterThan(0)
    images.forEach((image) => expect(image).toHaveAttribute("alt", ""))
  })
})
