import type { ReactElement } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it, vi } from "vitest"
import axe from "axe-core"

import { TourProvider } from "@/shared/tour"
import { render, screen } from "@/test/render"

import { PlayerDataProvider } from "../providers/player-data-provider"
import { UserJotProvider } from "../providers/userjot-provider"

import { DesktopShell } from "./desktop-layout"
import { MobileShell } from "./mobile-layout"
import { navItems } from "./nav-items"

const quickActions = { actions: [], select: () => false, flush: () => {} }
const home = navItems.find((item) => item.path === "/home")

function StubPage() {
  return <p>Stub page</p>
}

async function renderShell(shell: ReactElement) {
  const router = createMemoryRouter(
    [
      {
        path: "/home",
        element: shell,
        children: [{ index: true, element: <StubPage /> }],
      },
    ],
    { initialEntries: ["/home"] }
  )
  const { container } = render(
    <PlayerDataProvider baseUrl="http://api.test">
      <UserJotProvider>
        <TourProvider>
          <RouterProvider router={router} />
        </TourProvider>
      </UserJotProvider>
    </PlayerDataProvider>,
    { theme: true }
  )
  await screen.findByText("Stub page")
  return container
}

describe("shell accessibility", () => {
  it("desktop shell has no axe violations", async () => {
    const container = await renderShell(
      <DesktopShell
        activeSection={home}
        getEntryPath={(item) => item.path}
        onCreateGoal={vi.fn()}
        onPrimaryExpandedChange={vi.fn()}
        onSectionExpandedChange={vi.fn()}
        pageDescription="Home description"
        primaryExpanded={false}
        quickActions={quickActions}
        sectionExpanded
        sectionTitle="Home"
        visibleItems={navItems}
      />
    )
    expect((await axe.run(container)).violations).toEqual([])
  })

  it("mobile shell has no axe violations", async () => {
    const container = await renderShell(
      <MobileShell
        activeSection={home}
        isAuthenticated={false}
        onCreateGoal={vi.fn()}
        pageDescription="Home description"
        pageTitle="Home"
        quickActions={quickActions}
        visibleItems={navItems}
      />
    )
    expect((await axe.run(container)).violations).toEqual([])
  })
})
