import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { ProgressionSelect } from "./progression-select"

describe("ProgressionSelect", () => {
  it("names the trigger by its visible label", () => {
    render(
      <ProgressionSelect
        label="Target stars"
        value="Common:None"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText("Target stars")).toBe(
      screen.getByRole("combobox", { name: "Target stars" })
    )
  })
})
