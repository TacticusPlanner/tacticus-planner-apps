import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { RouteErrorBoundary } from "./route-error-boundary"

function Throwing({ error }: { error: unknown }): null {
  throw error
}

// Mirrors routes.tsx: a top-level boundary around everything and a nested one on the shell route,
// so a page failure is contained inside the shell while a shell/landing failure is caught above.
function renderRouter(
  initialPath: string,
  pageError: unknown,
  shellError?: unknown
) {
  const router = createMemoryRouter(
    [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "/",
            element: shellError ? (
              <Throwing error={shellError} />
            ) : (
              <div data-testid="landing" />
            ),
          },
          {
            element: (
              <div data-testid="shell">
                <Outlet />
              </div>
            ),
            errorElement: (
              <div data-testid="shell-boundary">
                <RouteErrorBoundary />
              </div>
            ),
            children: [
              { path: "/home", element: <div data-testid="home-page" /> },
              { path: "/dailies", element: <Throwing error={pageError} /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  )
  return render(<RouterProvider router={router} />)
}

describe("RouteErrorBoundary", () => {
  const reload = vi.fn()
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal("location", { pathname: "/dailies", search: "", reload })
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    consoleError.mockRestore()
    reload.mockReset()
  })

  it("reloads once for a stale-build error without rendering the fallback page", async () => {
    renderRouter(
      "/dailies",
      new TypeError("Failed to fetch dynamically imported module: /assets/x.js")
    )

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId("app-error-page")).not.toBeInTheDocument()
  })

  it("shows the fallback page when the same URL already used its reload", async () => {
    window.sessionStorage.setItem("tp:stale-reload:/dailies", "1")

    renderRouter(
      "/dailies",
      new TypeError("Failed to fetch dynamically imported module: /assets/x.js")
    )

    expect(await screen.findByTestId("app-error-page")).toBeVisible()
    expect(reload).not.toHaveBeenCalled()
  })

  it("renders the branded page for a generic render error, inside the shell boundary", async () => {
    const error = new Error("Cannot read properties of undefined (reading 'x')")
    renderRouter("/dailies", error)

    const page = await screen.findByTestId("app-error-page")
    expect(page).toBeVisible()
    expect(screen.getByTestId("shell-boundary")).toContainElement(page)
    expect(screen.getByText("appError.title")).toBeVisible()
    expect(screen.getByTestId("app-error-reload")).toHaveFocus()
    expect(page).not.toHaveTextContent("Cannot read properties")
    expect(page).not.toHaveTextContent("at ")
    expect(consoleError).toHaveBeenCalledWith("Route rendering failed", error)
    expect(reload).not.toHaveBeenCalled()
  })

  it("catches a landing/shell error with the top-level boundary", async () => {
    renderRouter("/", null, new Error("landing exploded"))

    expect(await screen.findByTestId("app-error-page")).toBeVisible()
    expect(screen.queryByTestId("shell-boundary")).not.toBeInTheDocument()
  })

  it("Reload reloads the page and Go to Home navigates without a reload", async () => {
    const user = userEvent.setup()
    renderRouter("/dailies", new Error("boom"))
    await screen.findByTestId("app-error-page")

    await user.click(screen.getByTestId("app-error-reload"))
    expect(reload).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId("app-error-home"))
    expect(await screen.findByTestId("home-page")).toBeVisible()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
