import { useLocation } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { MowsListPage } from "./mows-list-page"

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

function Path() {
  const location = useLocation()
  return <output data-testid="path">{location.pathname}</output>
}

function Page() {
  const { pathname } = useLocation()
  return pathname === "/library/machines-of-war" ? (
    <>
      <MowsListPage />
      <Path />
    </>
  ) : (
    <p data-testid="unit-route">unit</p>
  )
}

async function renderList(records: unknown[] | null = mows) {
  if (records) {
    await seedGameCatalog({ mows: records })
  }
  render(<Page />, {
    route: "/library/machines-of-war/:id?",
    initialEntries: ["/library/machines-of-war"],
  })
}

const listedNames = () =>
  within(screen.getByTestId("mows-list"))
    .getAllByRole("link")
    .map((link) => link.textContent)

afterEach(() => {
  vi.restoreAllMocks()
})

describe("MowsListPage", () => {
  it("lists every MoW by alliance, then faction, then name, and stays on the collection URL", async () => {
    await renderList()
    await screen.findByTestId("mows-list")
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
    const tile = await screen.findByRole("link", { name: /Galatian/ })
    expect(tile).toHaveAttribute(
      "href",
      "/library/machines-of-war/ultraDreadnought"
    )
    fireEvent.click(tile)
    expect(await screen.findByTestId("unit-route")).toBeInTheDocument()
  })

  it("searches by name, case-insensitively", async () => {
    await renderList()
    fireEvent.change(await screen.findByRole("searchbox"), {
      target: { value: "bio" },
    })
    expect(listedNames()).toEqual(["Biovore"])
  })

  it("offers to clear a search with no matches", async () => {
    await renderList()
    fireEvent.change(await screen.findByRole("searchbox"), {
      target: { value: "zzz" },
    })
    expect(screen.getByTestId("mows-no-matching")).toHaveTextContent(
      "No Machines of War match your search."
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByTestId("mows-list")).toBeInTheDocument()
  })

  it("waits for the catalog instead of showing an empty list", async () => {
    await renderList(null)
    expect(await screen.findByTestId("mows-loading")).toBeInTheDocument()
  })

  it("shows the load-failure state when the catalog can't be read", async () => {
    await seedGameCatalog({ mows })
    // Fail the IndexedDB read itself, under the real storage and queries.
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(() => {
      throw new Error("boom")
    })
    await renderList(null)
    expect(await screen.findByTestId("mows-load-failed")).toBeInTheDocument()
  })

  it("shows the no-records state for an empty catalog", async () => {
    await renderList([])
    expect(await screen.findByTestId("mows-no-matching")).toHaveTextContent(
      "No selectable entities are available."
    )
  })

  it("targets the search and the list on desktop and mobile", async () => {
    await renderList()
    await screen.findByTestId("mows-list")
    for (const steps of [tour.steps?.desktop, tour.steps?.mobile]) {
      expect(steps).toHaveLength(2)
      for (const step of steps ?? []) {
        expect(document.querySelector(step.target as string)).not.toBeNull()
      }
    }
  })
})
