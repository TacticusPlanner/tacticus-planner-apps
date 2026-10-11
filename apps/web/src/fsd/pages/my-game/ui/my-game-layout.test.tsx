import { render, screen } from "@/test/render"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"

import { MyGameLayout } from "./my-game-layout"

// Tab navigation between the My Game pages lives in the shared app-shell header's section-tabs
// row, not in MyGameLayout - see section-tabs.test.tsx. This only confirms the layout still
// renders whichever child route is active.
function renderMyGame(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/my-game" element={<MyGameLayout />}>
          <Route path="collection" element={<div>Collection route</div>} />
          <Route path="onslaught" element={<div>Onslaught route</div>} />
          <Route path="campaigns" element={<div>Campaigns route</div>} />
          <Route
            path="campaign-events"
            element={<div>Campaign events route</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("MyGameLayout", () => {
  it.each([
    ["/my-game/collection", "Collection route"],
    ["/my-game/onslaught", "Onslaught route"],
    ["/my-game/campaigns", "Campaigns route"],
    ["/my-game/campaign-events", "Campaign events route"],
  ])("renders the active child route at %s", (path, expectedText) => {
    renderMyGame(path)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it("lets only Collection use the full window width", () => {
    const { unmount } = renderMyGame("/my-game/collection")
    expect(screen.getByTestId("my-game-layout")).toHaveClass("max-w-none")
    unmount()

    renderMyGame("/my-game/campaigns")
    expect(screen.getByTestId("my-game-layout")).not.toHaveClass("max-w-none")
  })
})
