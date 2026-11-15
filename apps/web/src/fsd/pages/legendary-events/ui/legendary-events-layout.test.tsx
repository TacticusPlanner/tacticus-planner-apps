import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import { LegendaryEventsLayout } from "./legendary-events-layout"

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<LegendaryEventsLayout />} path="/legendary-events">
          <Route element={<div />} index />
          <Route element={<div />} path=":eventId/:tab?" />
        </Route>
      </Routes>
    </MemoryRouter>
  )
  return screen.getByTestId("legendary-events-layout")
}

describe("LegendaryEventsLayout", () => {
  it("keeps the width cap on the hub", () => {
    expect(renderAt("/legendary-events")).not.toHaveAttribute("data-wide")
  })

  it("uses the full width on an event page, on any tab", () => {
    expect(renderAt("/legendary-events/astarLysander/teams")).toHaveAttribute(
      "data-wide",
      "true"
    )
  })
})
