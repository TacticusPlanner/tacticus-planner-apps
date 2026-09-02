import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router"
import { describe, expect, it } from "vitest"

import { useLibraryRouteSelection } from "./use-library-route-selection"

function renderSelection({
  entry,
  entityIds,
  loading = false,
}: {
  entry: string
  entityIds: readonly string[] | undefined
  loading?: boolean
}) {
  return renderHook(
    () => {
      const location = useLocation()
      const selection = useLibraryRouteSelection({
        collectionPath: "/library/characters",
        entityId: location.pathname.split("/").at(-1),
        entityIds,
        loading,
      })
      return { ...selection, location }
    },
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="*" element={children} />
          </Routes>
        </MemoryRouter>
      ),
    }
  )
}

describe("useLibraryRouteSelection", () => {
  it("keeps a valid entity URL and its secondary state", async () => {
    const { result } = renderSelection({
      entry: "/library/characters/bellator?tab=abilities",
      entityIds: ["bellator", "calgar"],
    })

    await waitFor(() => expect(result.current.selectedId).toBe("bellator"))
    expect(result.current.location.search).toBe("?tab=abilities")
  })

  it("replaces a missing or invalid selection with the first record", async () => {
    const { result } = renderSelection({
      entry: "/library/characters/not-real?tab=abilities",
      entityIds: ["bellator", "calgar"],
    })

    await waitFor(() =>
      expect(result.current.location.pathname).toBe(
        "/library/characters/bellator"
      )
    )
    expect(result.current.location.search).toBe("?tab=abilities")
  })

  it("waits for loading and leaves an empty collection URL intact", async () => {
    const loading = renderSelection({
      entry: "/library/characters",
      entityIds: undefined,
      loading: true,
    })
    expect(loading.result.current.location.pathname).toBe("/library/characters")

    const empty = renderSelection({
      entry: "/library/characters?tab=abilities",
      entityIds: [],
    })
    await waitFor(() =>
      expect(empty.result.current.location.pathname).toBe("/library/characters")
    )
    expect(empty.result.current.location.search).toBe("?tab=abilities")
  })

  it("removes legacy character state while preserving all other parameters", async () => {
    const { result } = renderSelection({
      entry: "/library/characters/bellator?character=calgar&tab=abilities",
      entityIds: ["bellator"],
    })

    await waitFor(() =>
      expect(result.current.location.search).toBe("?tab=abilities")
    )
  })

  it("restores route-backed selection when browser history goes back", async () => {
    function HistoryHarness() {
      const location = useLocation()
      const navigate = useNavigate()
      const selection = useLibraryRouteSelection({
        collectionPath: "/library/characters",
        entityId: location.pathname.split("/").at(-1),
        entityIds: ["bellator", "calgar"],
        loading: false,
      })

      return (
        <>
          <output data-testid="selected">{selection.selectedId}</output>
          <button onClick={() => selection.select("calgar")}>select</button>
          <button onClick={() => navigate(-1)}>back</button>
        </>
      )
    }

    render(
      <MemoryRouter initialEntries={["/library/characters/bellator?tab=stats"]}>
        <Routes>
          <Route path="*" element={<HistoryHarness />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "select" }))
    await waitFor(() =>
      expect(screen.getByTestId("selected")).toHaveTextContent("calgar")
    )

    fireEvent.click(screen.getByRole("button", { name: "back" }))
    await waitFor(() =>
      expect(screen.getByTestId("selected")).toHaveTextContent("bellator")
    )
  })
})
