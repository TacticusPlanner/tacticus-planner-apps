import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { redirectOnlyHandle } from "@/shared/analytics"
import { render, screen, waitFor } from "@/test/render"

import { eventShopRoutes, routes } from "./route"

// Event shop moved from Dailies to Plan: old links and bookmarks still land on the same event,
// day and tab.
describe("Dailies › Event shop redirect", () => {
  const renderAt = (path: string) => {
    const router = createMemoryRouter(
      [
        { path: "/dailies", children: routes },
        { path: "/plan/event-shop/*", element: <p>plan event shop</p> },
      ],
      { initialEntries: [path] }
    )
    render(<RouterProvider router={router} />)
    return router
  }

  it.each([
    ["/dailies/event-shop", "/plan/event-shop"],
    [
      "/dailies/event-shop/november-2026?day=3&tab=plan",
      "/plan/event-shop/november-2026?day=3&tab=plan",
    ],
  ])("redirects %s to %s", async (from, to) => {
    const router = renderAt(from)

    await waitFor(() =>
      expect(screen.getByText("plan event shop")).toBeVisible()
    )
    const { pathname, search } = router.state.location
    expect(`${pathname}${search}`).toBe(to)
  })

  it("reports no page view for the old address, only for the event shop it lands on", () => {
    const redirects = routes.filter((route) =>
      route.path?.startsWith("event-shop")
    )
    expect(redirects).toHaveLength(2)
    for (const route of redirects) {
      expect(route.handle).toBe(redirectOnlyHandle)
    }
    // The bare Plan › Event shop picks the default event, which is the page reported.
    expect(eventShopRoutes.find((route) => route.index)?.handle).toBe(
      redirectOnlyHandle
    )
  })
})
