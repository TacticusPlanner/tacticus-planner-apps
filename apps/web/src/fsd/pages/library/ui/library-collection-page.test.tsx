import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

function renderCollection(
  entry: string,
  collection: "machines-of-war" | "npcs"
) {
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
  it("canonicalizes Machines of War and retains secondary query state", async () => {
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
    expect(screen.getByTestId("machines-of-war-library-page")).toBeVisible()
  })

  it("selects an NPC through the path-backed collection selector", async () => {
    records = [
      { id: "grots", name: "Grots" },
      { id: "guardsman", name: "Guardsman" },
    ]
    renderCollection("/library/npcs/grots?tab=stats", "npcs")

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" })
    fireEvent.click(await screen.findByText("Guardsman"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/npcs/guardsman?tab=stats"
      )
    )
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
