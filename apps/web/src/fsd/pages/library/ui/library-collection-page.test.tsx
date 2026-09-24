import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import {
  LibraryCollectionPage,
  LibraryNoRecordsPage,
} from "./library-collection-page"

let records: { id: string; name: string }[] | undefined

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
  }),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => records,
}))

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

function renderCollection(entry: string, collection: "machines-of-war") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path={`/library/${collection}/:entityId?`}
          element={
            <>
              <LibraryCollectionPage
                collection={collection}
                getRecords={vi.fn()}
              />
              <Location />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("LibraryCollectionPage", () => {
  it("shows the Machines of War placeholder and canonicalizes the URL", async () => {
    records = [
      { id: "malleus", name: "Malleus" },
      { id: "biovore", name: "Biovore" },
    ]
    renderCollection("/library/machines-of-war?tab=stats", "machines-of-war")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/machines-of-war/malleus?tab=stats"
      )
    )
    expect(
      screen.getByTestId("machines-of-war-library-page")
    ).toHaveTextContent(
      "collections.detailUnavailable:collections.machinesOfWar.label"
    )
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("keeps the loading state for a collection whose records are pending", () => {
    records = undefined
    renderCollection("/library/machines-of-war", "machines-of-war")

    expect(screen.getByText("loading")).toBeVisible()
    expect(
      screen.queryByTestId("machines-of-war-library-page")
    ).not.toBeInTheDocument()
  })

  it("keeps the no-records state for an empty collection", () => {
    records = []
    renderCollection("/library/machines-of-war", "machines-of-war")

    expect(screen.getByText("collections.noRecords")).toBeVisible()
    expect(
      screen.queryByTestId("machines-of-war-library-page")
    ).not.toBeInTheDocument()
  })

  it("keeps the empty Raid Boss collection URL and no-records state", async () => {
    render(
      <MemoryRouter
        initialEntries={["/library/raid-bosses/not-real?tab=stats"]}
      >
        <Routes>
          <Route
            path="/library/raid-bosses/:entityId?"
            element={
              <>
                <LibraryNoRecordsPage />
                <Location />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?tab=stats"
      )
    )
    expect(screen.getByTestId("raid-bosses-library-page")).toHaveTextContent(
      "collections.raidBossesNoRecords"
    )
  })
})
