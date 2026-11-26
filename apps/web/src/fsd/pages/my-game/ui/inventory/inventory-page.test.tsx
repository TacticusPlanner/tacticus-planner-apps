import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { InventoryPage } from "./inventory-page"

vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => ({ statusText: "Last synced 12 min ago" }),
}))

describe("InventoryPage", () => {
  it("names its tabs with the game's own terms and switches tab by route", async () => {
    render(<InventoryPage />, {
      route: "/my-game/inventory/:tab",
      initialEntries: ["/my-game/inventory/ascension"],
    })

    expect(screen.getByRole("tab", { name: "Ascension" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await userEvent.click(screen.getByRole("tab", { name: "Upgrades" }))
    expect(screen.getByRole("tab", { name: "Upgrades" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("says how old the counts are", () => {
    render(<InventoryPage />, {
      route: "/my-game/inventory/:tab",
      initialEntries: ["/my-game/inventory/upgrades"],
    })

    expect(screen.getByRole("status")).toHaveTextContent(
      "Last synced 12 min ago"
    )
  })

  it("falls back to Upgrades for an unknown tab", () => {
    render(<InventoryPage />, {
      route: "/my-game/inventory/:tab",
      initialEntries: ["/my-game/inventory/shards"],
    })

    expect(screen.getByRole("tab", { name: "Upgrades" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })
})
