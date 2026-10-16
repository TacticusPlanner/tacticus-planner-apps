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

// Same stand-in as the characters list's tests: runs the querier, returns its result once settled.
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
  mows: vi.fn(),
  synced: vi.fn(() => true),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getMows: () => catalog.mows(),
}))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getGameCatalogMetadata: () =>
    Promise.resolve(new Map(catalog.synced() ? [["mows", {}]] : [])),
}))

const mow = (id: string, name: string, faction: string, alliance: string) => ({
  id,
  name,
  faction,
  alliance,
})

const mows = [
  mow("tyranBiovore", "Biovore", "Tyranids", "Xenos"),
  mow("blackForgefiend", "Forgefiend", "BlackLegion", "Chaos"),
  mow("adeptExorcist", "Exorcist", "Sisterhood", "Imperial"),
  mow("ultraDreadnought", "Galatian", "Ultramarines", "Imperial"),
]

import { MowsListPage } from "./mows-list-page"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", { en: { library: enLibrary } })
})

function Path() {
  const location = useLocation()
  return <output data-testid="path">{location.pathname}</output>
}

async function renderList() {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <Routes>
          <Route
            path="/library/machines-of-war"
            element={
              <>
                <MowsListPage />
                <Path />
              </>
            }
          />
          <Route
            path="/library/machines-of-war/:id"
            element={<p data-testid="unit-route">unit</p>}
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
  await act(async () => {})
}

const listedNames = () =>
  within(screen.getByTestId("mows-list"))
    .getAllByRole("link")
    .map((link) => link.textContent)

describe("MowsListPage", () => {
  beforeEach(() => {
    catalog.mows.mockResolvedValue(mows)
    catalog.synced.mockReturnValue(true)
  })

  it("lists every MoW by alliance, then faction, then name, and stays on the collection URL", async () => {
    await renderList()
    expect(listedNames()).toEqual([
      "Galatian",
      "Exorcist",
      "Forgefiend",
      "Biovore",
    ])
    expect(screen.getByTestId("path")).toHaveTextContent(
      "/library/machines-of-war"
    )
    expect(screen.queryByText(/aren't available yet/)).not.toBeInTheDocument()
  })

  it("opens a MoW's unit page from its tile", async () => {
    await renderList()
    expect(screen.getByTestId("mow-tile-ultraDreadnought")).toHaveAttribute(
      "href",
      "/library/machines-of-war/ultraDreadnought"
    )
    fireEvent.click(screen.getByTestId("mow-tile-ultraDreadnought"))
    expect(screen.getByTestId("unit-route")).toBeInTheDocument()
  })

  it("searches by name, case-insensitively", async () => {
    await renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "bio" },
    })
    expect(listedNames()).toEqual(["Biovore"])
  })

  it("offers to clear a search with no matches", async () => {
    await renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    })
    expect(screen.getByTestId("mows-no-matching")).toHaveTextContent(
      "No Machines of War match your search."
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByTestId("mows-list")).toBeInTheDocument()
  })

  it("waits for the catalog instead of showing an empty list", async () => {
    catalog.synced.mockReturnValue(false)
    await renderList()
    expect(screen.getByTestId("mows-loading")).toBeInTheDocument()
  })

  it("shows the load-failure state when the catalog can't be read", async () => {
    catalog.mows.mockRejectedValue(new Error("boom"))
    await renderList()
    expect(screen.getByTestId("mows-load-failed")).toBeInTheDocument()
  })

  it("shows the no-records state for an empty catalog", async () => {
    catalog.mows.mockResolvedValue([])
    await renderList()
    expect(screen.getByTestId("mows-no-matching")).toHaveTextContent(
      enLibrary.collections.noRecords
    )
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
})
