import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it } from "vitest"

import { readUnitOrigin, unitNeighbours, unitOriginState } from "./unit-origin"
import { UnitTabs } from "./unit-tabs"
import { useUnitTab } from "./use-unit-tab"

describe("unit origin", () => {
  it("reads an origin from history state and ignores anything else", () => {
    const origin = { kind: "list" as const, ids: ["a", "b"] }
    expect(readUnitOrigin(unitOriginState(origin))).toEqual(origin)
    expect(readUnitOrigin(null)).toBeUndefined()
    expect(readUnitOrigin({ unitOrigin: { kind: "elsewhere", ids: [] } })).toBe(
      undefined
    )
  })

  it("finds the neighbours and position in the origin's order", () => {
    expect(unitNeighbours(["a", "b", "c"], "b")).toEqual({
      index: 1,
      total: 3,
      previousId: "a",
      nextId: "c",
    })
    expect(unitNeighbours(["a", "b", "c"], "a").previousId).toBeUndefined()
    expect(unitNeighbours(["a", "b", "c"], "c").nextId).toBeUndefined()
    expect(unitNeighbours(["a", "b"], "z")).toEqual({ index: -1, total: 2 })
  })
})

function TabsHarness() {
  const [tab, select] = useUnitTab(["details", "rankup"] as const)
  const location = useLocation()
  return (
    <>
      <UnitTabs
        tabs={[
          { id: "details", label: "Details" },
          { id: "rankup", label: "Rank-up materials" },
        ]}
        active={tab}
        onSelect={select}
        label="Sections"
        isMobile={false}
        panelId="panel"
      />
      <output data-testid="search">{location.search}</output>
    </>
  )
}

function renderTabs(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/unit" element={<TabsHarness />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("unit tabs", () => {
  it("opens the tab named in the URL", () => {
    renderTabs("/unit?tab=rankup")
    expect(
      screen.getByRole("tab", { name: "Rank-up materials" })
    ).toHaveAttribute("aria-selected", "true")
  })

  it("shows the first tab for an unknown value", () => {
    renderTabs("/unit?tab=nonsense")
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("changes only the tab parameter, keeping the calculator's range", () => {
    renderTabs("/unit?rankStart=Gold1&rankEnd=Diamond1")
    fireEvent.click(screen.getByRole("tab", { name: "Rank-up materials" }))
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?rankStart=Gold1&rankEnd=Diamond1&tab=rankup"
    )
    fireEvent.click(screen.getByRole("tab", { name: "Details" }))
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?rankStart=Gold1&rankEnd=Diamond1"
    )
  })

  it("moves between tabs with the arrow keys", () => {
    renderTabs("/unit")
    fireEvent.keyDown(screen.getByRole("tab", { name: "Details" }), {
      key: "ArrowRight",
    })
    const rankup = screen.getByRole("tab", { name: "Rank-up materials" })
    expect(rankup).toHaveAttribute("aria-selected", "true")
    expect(rankup).toHaveFocus()
  })
})
