import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

import { render, screen } from "@/test/render"

const {
  getAllAccountsMock,
  silentSignInStatusMock,
  useIsAuthenticatedMock,
  useMsalMock,
} = vi.hoisted(() => ({
  getAllAccountsMock: vi.fn<() => unknown[]>(() => []),
  silentSignInStatusMock: vi.fn<() => "idle" | "checking" | "failed">(
    () => "idle"
  ),
  useIsAuthenticatedMock: vi.fn(() => false),
  useMsalMock: vi.fn<() => { inProgress: InteractionStatus }>(() => ({
    inProgress: InteractionStatus.None,
  })),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => useIsAuthenticatedMock(),
  useMsal: () => ({
    ...useMsalMock(),
    instance: { getAllAccounts: () => getAllAccountsMock() },
  }),
}))

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useSilentSignInStatus: () => silentSignInStatusMock(),
}))

import { AuthenticatedRoute, LandingRoute } from "./auth-route-guards"

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

  it("waits for MSAL interaction to resolve before deciding", () => {
    useMsalMock.mockReturnValue({ inProgress: InteractionStatus.Startup })

    render(
      <MemoryRouter initialEntries={["/setup/key"]}>
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

    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument()
    expect(screen.queryByTestId("probe")).not.toBeInTheDocument()

    useMsalMock.mockReturnValue({ inProgress: InteractionStatus.None })
  })
})

describe("AuthenticatedRoute during a silent sign-in", () => {
  function renderProtected() {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route element={<Probe />} path="/" />
          <Route
            element={
              <AuthenticatedRoute>
                <div data-testid="protected-content" />
              </AuthenticatedRoute>
            }
            path="/home"
          />
        </Routes>
      </MemoryRouter>
    )
  }

  it("shows the boot screen instead of the landing page while the restore runs", () => {
    useIsAuthenticatedMock.mockReturnValue(false)
    silentSignInStatusMock.mockReturnValue("checking")

    renderProtected()

    expect(screen.getByTestId("app-loading")).toBeVisible()
    expect(screen.queryByTestId("probe")).not.toBeInTheDocument()

    silentSignInStatusMock.mockReturnValue("idle")
  })

  it("keeps waiting while msal-react catches up with an account the restore added", () => {
    useIsAuthenticatedMock.mockReturnValue(false)
    getAllAccountsMock.mockReturnValue([{ homeAccountId: "a" }])

    renderProtected()

    expect(screen.getByTestId("app-loading")).toBeVisible()
    expect(screen.queryByTestId("probe")).not.toBeInTheDocument()

    getAllAccountsMock.mockReturnValue([])
  })

  it("sends the visitor to sign in once the restore failed", () => {
    useIsAuthenticatedMock.mockReturnValue(false)
    silentSignInStatusMock.mockReturnValue("failed")

    renderProtected()

    expect(screen.getByTestId("probe")).toHaveTextContent("/?next=%2Fhome")

    silentSignInStatusMock.mockReturnValue("idle")
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

  it("shows the landing page to a signed-in visitor on a bare /", () => {
    useIsAuthenticatedMock.mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<LandingRoute />} path="/" />
          <Route element={<Probe />} path="/home" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId("landing-page")).toBeVisible()
    expect(screen.queryByTestId("probe")).not.toBeInTheDocument()
  })

  it("waits for MSAL interaction to resolve before deciding", () => {
    useMsalMock.mockReturnValue({ inProgress: InteractionStatus.Startup })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<LandingRoute />} path="/" />
          <Route element={<Probe />} path="/home" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole("status")).toBeVisible()
    expect(screen.queryByTestId("probe")).not.toBeInTheDocument()

    useMsalMock.mockReturnValue({ inProgress: InteractionStatus.None })
  })
})
