import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"
import { ready } from "@/test/fixtures/daily-raids"
import { setViewportWidth } from "@/test/viewport"

import { MaterialDetailsProvider } from "./material-details-provider"
import { ResourceIconWithTooltip } from "./resource-icon"

const visual = {
  kind: "upgrade" as const,
  id: "U1" as never,
  rarity: "Common" as never,
  crafted: false,
}

describe("ResourceIconWithTooltip", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("only names its material outside a plan run", async () => {
    const user = userEvent.setup()
    render(<ResourceIconWithTooltip label="Ceramite" visual={visual} />)

    const icon = screen.getByRole("button", { name: "Ceramite" })
    expect(icon).not.toHaveAttribute("aria-haspopup")
    await user.click(icon)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens the material's details with today's raids and its have / need", async () => {
    const user = userEvent.setup()
    render(
      <MaterialDetailsProvider raids={ready()}>
        <ResourceIconWithTooltip
          label="Ceramite"
          resourceId="U1"
          visual={visual}
        />
      </MaterialDetailsProvider>
    )

    await user.hover(screen.getByRole("button", { name: "Ceramite" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Ceramite")
    await user.click(screen.getByRole("button", { name: "Ceramite" }))

    const details = await screen.findByRole("dialog", { name: "Ceramite" })
    expect(details).toHaveTextContent("265 of 500 owned")
    expect(details).toHaveTextContent("Needed by Bellator, Aleph-Null")
    expect(
      within(details).getByRole("list", { name: "Raids" })
    ).toHaveTextContent("Indomitus")
  })

  it("opens the same details in a bottom sheet on a phone", async () => {
    setViewportWidth(390)
    const user = userEvent.setup()
    render(
      <MaterialDetailsProvider raids={ready()}>
        <ResourceIconWithTooltip
          label="Ceramite"
          resourceId="U1"
          visual={visual}
        />
      </MaterialDetailsProvider>
    )

    await user.click(screen.getByRole("button", { name: "Ceramite" }))
    const sheet = await screen.findByRole("dialog", { name: "Ceramite" })
    expect(sheet).toHaveTextContent("265 of 500 owned")
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })
})
