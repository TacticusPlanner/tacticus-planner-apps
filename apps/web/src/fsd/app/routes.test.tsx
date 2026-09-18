import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

import { render, screen } from "@/test/render"

const { useIsAuthenticatedMock, useMsalMock } = vi.hoisted(() => ({
  useIsAuthenticatedMock: vi.fn(() => false),
  useMsalMock: vi.fn(() => ({ inProgress: InteractionStatus.None })),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => useIsAuthenticatedMock(),
  useMsal: () => useMsalMock(),
}))

import { AuthenticatedRoute, LandingRoute } from "./routes"

// Reports where a <Navigate> landed, so a redirect is asserted by destination rather than by
// mocking the router's navigation.
function Probe() {
  const location = useLocation()
  return (
    <div data-testid="probe">{`${location.pathname}${location.search}`}</div>
  )
}

describe("AuthenticatedRoute", () => {
  it("preserves the current destination when redirecting an unauthenticated visitor", () => {
    useIsAuthenticatedMock.mockReturnValue(false)

    render(
      <MemoryRouter initialEntries={["/setup/key?next=%2Fguild%2Fmembers"]}>
        <Routes>
          <Route element={<Probe />} path="/" />
          <Route
            element={
              <AuthenticatedRoute>
                <div data-testid="protected-content" />
              </AuthenticatedRoute>
            }
            path="/setup/key"
          />
        </Routes>
      </MemoryRouter>
    )

    // Encoded so LandingRoute can read it back as one opaque `next` value — see its test below.
    expect(screen.getByTestId("probe")).toHaveTextContent(
      "/?next=%2Fsetup%2Fkey%3Fnext%3D%252Fguild%252Fmembers"
    )
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
  })

  it("renders children once authenticated", () => {
    useIsAuthenticatedMock.mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={["/setup/key"]}>
        <Routes>
          <Route
            element={
              <AuthenticatedRoute>
                <div data-testid="protected-content" />
              </AuthenticatedRoute>
            }
            path="/setup/key"
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId("protected-content")).toBeVisible()
  })
})

describe("LandingRoute", () => {
  it("restores the preserved destination after sign-in, including a /setup/* address", () => {
    useIsAuthenticatedMock.mockReturnValue(true)

    render(
      <MemoryRouter
        initialEntries={[
          "/?next=%2Fsetup%2Fkey%3Fnext%3D%252Fguild%252Fmembers",
        ]}
      >
        <Routes>
          <Route element={<LandingRoute />} path="/" />
          <Route element={<Probe />} path="/setup/key" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId("probe")).toHaveTextContent(
      "/setup/key?next=%2Fguild%2Fmembers"
    )
  })

  it("falls back to the default destination for a crafted next value", () => {
    useIsAuthenticatedMock.mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={["/?next=https%3A%2F%2Fevil.example"]}>
        <Routes>
          <Route element={<LandingRoute />} path="/" />
          <Route element={<Probe />} path="/home" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId("probe")).toHaveTextContent("/home")
  })
})
