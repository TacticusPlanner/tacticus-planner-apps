import { render, screen } from "@/test/render"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"

import { ProgressLayout } from "./progress-layout"

// Tab navigation between Onslaught/Campaigns/Campaign Events/XP Income now lives in the shared
// app-shell header's section-tabs row, not in ProgressLayout - see section-tabs.test.tsx. This only
// confirms the layout still renders whichever child route is active.
function renderProgress(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/progress" element={<ProgressLayout />}>
          <Route path="onslaught" element={<div>Onslaught route</div>} />
          <Route path="campaigns" element={<div>Campaigns route</div>} />
          <Route
            path="campaign-events"
            element={<div>Campaign events route</div>}
          />
          <Route path="xp-income" element={<div>XP Income route</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("ProgressLayout", () => {
  it.each([
    ["/progress/onslaught", "Onslaught route"],
    ["/progress/campaigns", "Campaigns route"],
    ["/progress/campaign-events", "Campaign events route"],
    ["/progress/xp-income", "XP Income route"],
  ])("renders the active child route at %s", (path, expectedText) => {
    renderProgress(path)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })
})
