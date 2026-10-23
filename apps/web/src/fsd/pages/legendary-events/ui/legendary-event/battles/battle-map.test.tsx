import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import { BattleMap } from "./battle-map"

let i18n: I18n

function Harness({ isMobile, mapId }: { isMobile: boolean; mapId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <BattleMap
      alt="Map of Alpha battle 1"
      isMobile={isMobile}
      mapId={mapId}
      onOpenChange={setOpen}
      open={open}
    />
  )
}

const renderMap = (isMobile: boolean, mapId: string) =>
  render(<Harness isMobile={isMobile} mapId={mapId} />, {
    wrapper: i18nWrapper(i18n),
  })

describe("BattleMap", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("shows the battle's map with its alt text on desktop, lazily loaded", () => {
    renderMap(false, "LE1_26")
    const image = screen.getByRole("img", { name: "Map of Alpha battle 1" })
    expect(image).toHaveAttribute(
      "src",
      expect.stringMatching(/\/le_maps\/LE1_26\.webp$/)
    )
    expect(image).toHaveAttribute("loading", "lazy")
  })

  it("keeps the map in a collapsed disclosure on mobile that stays open across battles", () => {
    const { rerender } = renderMap(true, "LE1_26")
    const toggle = screen.getByRole("button", { name: "Map" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("img")).toBeNull()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByTestId("battle-map-image")).toHaveAttribute(
      "data-map",
      "LE1_26"
    )

    rerender(<Harness isMobile mapId="LE1_27" />)
    expect(screen.getByRole("button", { name: "Map" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByTestId("battle-map-image")).toHaveAttribute(
      "data-map",
      "LE1_27"
    )
  })

  it("shows Map not available for a map with no image and on a load error", () => {
    const { unmount } = renderMap(false, "C4_35")
    expect(screen.getByTestId("battle-map-unavailable")).toHaveTextContent(
      "Map not available"
    )
    unmount()

    renderMap(false, "LE1_26")
    fireEvent.error(screen.getByTestId("battle-map-image"))
    expect(screen.getByTestId("battle-map-unavailable")).toHaveTextContent(
      "Map not available"
    )
  })
})
