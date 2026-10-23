import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { render, screen } from "@/test/render"

const traitText: Record<string, unknown> = {
  LivingMetal: {
    description: "Regenerates {[hpPct]}% of its max Health.",
    variables: { hpPct: [10] },
  },
}

const rules = vi.hoisted(() => ({ state: { ready: true, failed: false } }))

vi.mock("@/entities/npc", () => ({
  useNpcTraitText: () => ({
    ...rules.state,
    retry: () => {},
    text: (id: string) => (rules.state.ready ? traitText[id] : undefined),
  }),
}))

import { NpcTraits } from "./npc-traits"

describe("NpcTraits", () => {
  it("shows the trait name on the chip at every width", () => {
    render(<NpcTraits traits={["LivingMetal", "Mechanical"]} rarity="Common" />)

    expect(screen.getByTestId("npc-trait-LivingMetal")).toHaveTextContent(
      "Living Metal"
    )
    expect(screen.getByTestId("npc-trait-Mechanical")).toHaveTextContent(
      "Mechanical"
    )
  })

  it("opens the description in a popover without reflowing the row", async () => {
    const user = userEvent.setup()
    render(<NpcTraits traits={["LivingMetal"]} rarity="Common" />)

    expect(screen.queryByText(/Regenerates/)).toBeNull()

    await user.click(screen.getByRole("button", { name: "Living Metal" }))

    // The constant resolves through the shared renderer at level 1; assert on the whole popover,
    // since the renderer splits the styled description across sibling spans.
    const popover = await screen.findByRole("dialog")
    expect(popover).toHaveTextContent("Regenerates")
    expect(popover).toHaveTextContent("10")
  })

  it("renders a trait with no rules text as a plain, non-interactive chip", () => {
    render(<NpcTraits traits={["Mechanical"]} rarity="Common" />)

    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByTestId("npc-trait-Mechanical")).toBeVisible()
  })

  it("opens a loading line while the trait text downloads", async () => {
    const user = userEvent.setup()
    rules.state = { ready: false, failed: false }
    render(<NpcTraits traits={["LivingMetal"]} rarity="Common" />)

    await user.click(screen.getByRole("button", { name: "Living Metal" }))
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Loading rules text…"
    )
    rules.state = { ready: true, failed: false }
  })

  it("keeps the empty state when the variation has no traits", () => {
    render(<NpcTraits traits={[]} rarity="Common" />)

    expect(screen.getByTestId("npc-traits-empty")).toBeVisible()
  })
})
