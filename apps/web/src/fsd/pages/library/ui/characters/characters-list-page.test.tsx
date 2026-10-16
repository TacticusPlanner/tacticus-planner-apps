import { useEffect, useState } from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n } from "@/test/i18n"

import enLibrary from "../../../../../../public/locales/en/library.json"

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

// Same stand-in as the calculator's tests: runs the querier, returns its result once settled.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const catalog = vi.hoisted(() => ({
  characters: vi.fn(),
  synced: vi.fn(() => true),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharacters: () => catalog.characters(),
}))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getGameCatalogMetadata: () =>
    Promise.resolve(new Map(catalog.synced() ? [["characters", {}]] : [])),
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

import { CharactersListPage } from "./characters-list-page"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", { en: { library: enLibrary } })
})

function Search() {
  return <output data-testid="search">{useLocation().search}</output>
}

async function renderList(url = "/library/characters") {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/library/characters"
            element={
              <>
                <CharactersListPage />
                <Search />
              </>
            }
          />
          <Route
            path="/library/characters/:id"
            element={<p data-testid="unit-route">unit</p>}
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
  await act(async () => {})
}

describe("CharactersListPage", () => {
  beforeEach(() => {
    catalog.characters.mockResolvedValue(characters)
    catalog.synced.mockReturnValue(true)
  })

  it("lists every character by alliance, then faction, then name", async () => {
    await renderList()
    const names = within(screen.getByTestId("characters-list"))
      .getAllByRole("link")
      .map((link) => link.textContent)
    // Imperial (Ultramarines before Sisterhood, by game order), then Chaos, then Xenos. Names are
    // the localized ones: `necroSpyder` is "Aleph-Null" in the characters namespace.
    expect(names).toEqual([
      "Calgar",
      "Tigurius",
      "Celestine",
      "Abaddon",
      "Aleph-Null",
    ])
  })

  it("opens a character's unit page from its tile", async () => {
    await renderList()
    expect(screen.getByTestId("character-tile-ultraTigurius")).toHaveAttribute(
      "href",
      "/library/characters/ultraTigurius"
    )
    fireEvent.click(screen.getByTestId("character-tile-ultraTigurius"))
    expect(screen.getByTestId("unit-route")).toBeInTheDocument()
  })

  it("searches by name, case-insensitively", async () => {
    await renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "TIG" },
    })
    expect(
      within(screen.getByTestId("characters-list"))
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["Tigurius"])
  })

  it("offers to clear a search with no matches", async () => {
    await renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    })
    expect(screen.getByTestId("characters-no-matching")).toHaveTextContent(
      "No characters match your search."
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByTestId("characters-list")).toBeInTheDocument()
  })

  it("waits for the catalog instead of showing an empty list", async () => {
    catalog.synced.mockReturnValue(false)
    await renderList()
    expect(screen.getByTestId("characters-loading")).toBeInTheDocument()
    expect(
      screen.queryByTestId("characters-no-matching")
    ).not.toBeInTheDocument()
  })

  it("shows the load-failure state when the catalog can't be read", async () => {
    catalog.characters.mockRejectedValue(new Error("boom"))
    await renderList()
    expect(screen.getByTestId("characters-load-failed")).toBeInTheDocument()
  })

  it("targets the search and the list on desktop and mobile", async () => {
    await renderList()
    for (const steps of [tour.steps?.desktop, tour.steps?.mobile]) {
      expect(steps).toHaveLength(2)
      for (const step of steps ?? []) {
        expect(document.querySelector(step.target as string)).not.toBeNull()
      }
    }
  })

  it("drops the former calculator's parameters from the URL", async () => {
    await renderList("/library/characters?rankStart=Iron1&rankEnd=Gold1")
    expect(screen.getByTestId("search")).toBeEmptyDOMElement()
    expect(screen.getByTestId("characters-list")).toBeInTheDocument()
  })
})
