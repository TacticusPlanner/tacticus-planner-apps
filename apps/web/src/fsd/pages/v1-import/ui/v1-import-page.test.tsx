import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import type { V1ImportSelection } from "@/features/v1-import"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { lastDefaultSelection } = vi.hoisted(() => ({
  lastDefaultSelection: { current: undefined as V1ImportSelection | undefined },
}))

// The panel's own submit/report behavior is covered by `v1-import-panel.test.tsx`; this page only
// owns the header, the back affordance, and which default selection it hands the panel.
vi.mock("@/features/v1-import", () => ({
  V1ImportPanel: ({
    defaultSelection,
  }: {
    defaultSelection: V1ImportSelection
  }) => {
    lastDefaultSelection.current = defaultSelection
    return <div data-testid="stub-v1-import-panel" />
  },
}))

import { V1ImportPage } from "./v1-import-page"

function Probe() {
  const location = useLocation()
  return <div data-testid="probe">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/account/v1-import"]}>
      <Routes>
        <Route element={<V1ImportPage />} path="/account/v1-import" />
        <Route element={<Probe />} path="/home" />
      </Routes>
    </MemoryRouter>
  )
}

describe("V1ImportPage", () => {
  it("renders the panel with everything unchecked by default", () => {
    renderPage()

    expect(screen.getByTestId("stub-v1-import-panel")).toBeVisible()
    expect(lastDefaultSelection.current).toEqual({
      personalTacticusApiKey: false,
      tacticusUserId: false,
      guildApiToken: false,
      goals: false,
      onslaughtProgress: false,
      campaignEventProgress: false,
    })
  })

  it("shows a heading naming the import", () => {
    renderPage()

    expect(
      screen.getByRole("heading", { name: "goals.v1Import.title" })
    ).toBeVisible()
  })

  it("navigates home from the back button", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole("button", { name: "goals.v1Import.back" })
    )

    expect(await screen.findByTestId("probe")).toHaveTextContent("/home")
  })
})
