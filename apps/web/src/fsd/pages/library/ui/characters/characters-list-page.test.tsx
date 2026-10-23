import { useLocation } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { CharactersListPage } from "./characters-list-page"

const tour = vi.hoisted(() => ({
  steps: undefined as
    | { desktop: { target: unknown }[]; mobile?: { target: unknown }[] }
    | undefined,
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: typeof tour.steps) => {
    tour.steps = steps
  },
}))

const character = (
  id: string,
  name: string,
  faction: string,
  alliance: string
) => ({ id, name, faction, alliance })

const characters = [
  character("blackAbaddon", "Abaddon", "BlackLegion", "Chaos"),
  character("ultraCalgar", "Calgar", "Ultramarines", "Imperial"),
  character("ultraTigurius", "Tigurius", "Ultramarines", "Imperial"),
  character("necroSpyder", "Spyder", "Necrons", "Xenos"),
  character("sistersCelestine", "Celestine", "Sisterhood", "Imperial"),
]

function Search() {
  return <output data-testid="search">{useLocation().search}</output>
}

function Page() {
  const { pathname } = useLocation()
  return pathname === "/library/characters" ? (
    <>
      <CharactersListPage />
      <Search />
    </>
  ) : (
    <p data-testid="unit-route">unit</p>
  )
}

async function renderList(
  url = "/library/characters",
  { seed = true }: { seed?: boolean } = {}
) {
  if (seed) {
    await seedGameCatalog({ characters })
  }
  render(<Page />, { route: "/library/characters/:id?", initialEntries: [url] })
}

const listNames = () =>
  within(screen.getByTestId("characters-list"))
    .getAllByRole("link")
    .map((link) => link.textContent)

afterEach(() => {
  vi.restoreAllMocks()
})

describe("CharactersListPage", () => {
  it("lists every character by alliance, then faction, then name", async () => {
    await renderList()
    await screen.findByTestId("characters-list")
    // Imperial (Ultramarines before Sisterhood, by game order), then Chaos, then Xenos. Names are
    // the localized ones: `necroSpyder` is "Aleph-Null" in the characters namespace.
    expect(listNames()).toEqual([
      "Calgar",
      "Tigurius",
      "Celestine",
      "Abaddon",
      "Aleph-Null",
    ])
  })

  it("opens a character's unit page from its tile", async () => {
    await renderList()
    const tile = await screen.findByRole("link", { name: /Tigurius/ })
    expect(tile).toHaveAttribute("href", "/library/characters/ultraTigurius")
    fireEvent.click(tile)
    expect(await screen.findByTestId("unit-route")).toBeInTheDocument()
  })

  it("searches by name, case-insensitively", async () => {
    await renderList()
    fireEvent.change(await screen.findByRole("searchbox"), {
      target: { value: "TIG" },
    })
    expect(listNames()).toEqual(["Tigurius"])
  })

  it("offers to clear a search with no matches", async () => {
    await renderList()
    fireEvent.change(await screen.findByRole("searchbox"), {
      target: { value: "zzz" },
    })
    expect(screen.getByTestId("characters-no-matching")).toHaveTextContent(
      "No characters match your search."
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByTestId("characters-list")).toBeInTheDocument()
  })

  it("waits for the catalog instead of showing an empty list", async () => {
    await renderList(undefined, { seed: false })
    expect(await screen.findByTestId("characters-loading")).toBeInTheDocument()
    expect(
      screen.queryByTestId("characters-no-matching")
    ).not.toBeInTheDocument()
  })

  it("shows the load-failure state when the catalog can't be read", async () => {
    await seedGameCatalog({ characters })
    // Fail the IndexedDB read itself, under the real storage and queries.
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(() => {
      throw new Error("boom")
    })
    await renderList(undefined, { seed: false })
    expect(
      await screen.findByTestId("characters-load-failed")
    ).toBeInTheDocument()
  })

  it("targets the search and the list on desktop and mobile", async () => {
    await renderList()
    await screen.findByTestId("characters-list")
    for (const steps of [tour.steps?.desktop, tour.steps?.mobile]) {
      expect(steps).toHaveLength(2)
      for (const step of steps ?? []) {
        expect(document.querySelector(step.target as string)).not.toBeNull()
      }
    }
  })

  it("drops the former calculator's parameters from the URL", async () => {
    await renderList("/library/characters?rankStart=Iron1&rankEnd=Gold1")
    expect(await screen.findByTestId("characters-list")).toBeInTheDocument()
    expect(screen.getByTestId("search")).toBeEmptyDOMElement()
  })
})
