import { useIsAuthenticated, useMsal } from "@azure/msal-react"
import { getCharacters } from "@workspace/game-catalog/queries"
import { useTranslation } from "react-i18next"
import { useLocation, useParams } from "react-router"
import { describe, expect, it } from "vitest"

import { useCatalogDataset } from "@/shared/local-data"

import { setTestAuth } from "./auth"
import { render, renderHook, screen, waitFor } from "./render"
import { seedGameCatalog } from "./seed"

describe("test harness", () => {
  it("runs a real IndexedDB that round-trips seeded catalog records", async () => {
    expect(globalThis.indexedDB).toBeDefined()

    await seedGameCatalog({
      characters: [{ id: "ultraCalgar", name: "Calgar" }],
    })

    expect(await getCharacters()).toEqual([
      { id: "ultraCalgar", name: "Calgar" },
    ])
  })

  it("starts every test from an empty store", async () => {
    expect(await getCharacters()).toEqual([])
  })

  it("resolves seeded data through the read layer", async () => {
    await seedGameCatalog({
      characters: [{ id: "ultraCalgar", name: "Calgar" }],
    })

    const { result } = renderHook(() => useCatalogDataset("characters"))

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "ready",
        data: [{ id: "ultraCalgar" }],
      })
    )
  })

  it("translates with the real English resources", () => {
    function Close() {
      const { t } = useTranslation("common")
      return <button>{t("common.close")}</button>
    }

    render(<Close />)

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
  })

  it("reports signed out by default and signed in after setTestAuth", () => {
    const signedOut = renderHook(() => useIsAuthenticated())
    expect(signedOut.result.current).toBe(false)

    setTestAuth({ authenticated: true })
    const signedIn = renderHook(() => useMsal())
    expect(signedIn.result.current.accounts).toHaveLength(1)
    expect(signedIn.result.current.instance.getActiveAccount()).toEqual(
      signedIn.result.current.accounts[0]
    )
  })

  it("throws when app code calls an instance method the stub lacks", () => {
    const { result } = renderHook(() => useMsal())
    const instance = result.current.instance as unknown as Record<
      string,
      unknown
    >

    expect(() => instance.logoutPopup).toThrow(/does not implement/)
  })

  it("renders without a router or theme by default", () => {
    function Probe() {
      return <p>plain</p>
    }

    render(<Probe />)

    expect(screen.getByText("plain")).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass("light", "dark")
  })

  it("mounts the UI as a route with its params", async () => {
    function Probe() {
      const { goalId } = useParams()
      const { pathname } = useLocation()
      return <p>{`${goalId} at ${pathname}`}</p>
    }

    render(<Probe />, {
      route: "/plan/goals/:goalId",
      initialEntries: ["/plan/goals/g1"],
    })

    expect(await screen.findByText("g1 at /plan/goals/g1")).toBeInTheDocument()
  })

  it("applies the stored theme when theme is on", async () => {
    window.localStorage.setItem("theme", "dark")

    render(<p>themed</p>, { theme: true })

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"))
    document.documentElement.classList.remove("dark")
  })
})
