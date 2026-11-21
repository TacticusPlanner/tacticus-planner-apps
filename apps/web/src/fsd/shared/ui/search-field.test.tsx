import { useState } from "react"
import type { i18n as I18n } from "i18next"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen } from "@/test/render"

import { EmptyState } from "./empty-state"
import { SearchField } from "./search-field"

let i18n: I18n

function Harness({
  debounceMs,
  onChange = vi.fn(),
}: {
  debounceMs?: number
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState("")
  return (
    <>
      {/* Writes the value from outside the field, like a link or Back would. */}
      {["ork", "dan"].map((outside) => (
        <button key={outside} onClick={() => setValue(outside)} type="button">
          {`Set ${outside}`}
        </button>
      ))}
      <SearchField
        debounceMs={debounceMs}
        label="Search units"
        onChange={(next) => {
          onChange(next)
          setValue(next)
        }}
        value={value}
      />
    </>
  )
}

describe("SearchField", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("is a named search box with the default placeholder and a clear X while it has text", async () => {
    const user = userEvent.setup()
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    const box = screen.getByRole("searchbox", { name: "Search units" })
    expect(box).toHaveAttribute("placeholder", "Search by name")
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()

    await user.type(box, "dan")
    expect(box).toHaveValue("dan")
    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(box).toHaveValue("")
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
  })

  it("reports once typing pauses when debounced, and a clear at once", () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      render(<Harness debounceMs={200} onChange={onChange} />, {
        wrapper: i18nWrapper(i18n),
      })
      const box = screen.getByRole("searchbox", { name: "Search units" })

      fireEvent.change(box, { target: { value: "da" } })
      fireEvent.change(box, { target: { value: "dan" } })
      expect(box).toHaveValue("dan")
      expect(onChange).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(onChange).toHaveBeenCalledExactlyOnceWith("dan")

      fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
      expect(onChange).toHaveBeenLastCalledWith("")
      expect(box).toHaveValue("")
    } finally {
      vi.useRealTimers()
    }
  })

  it("drops a pending query when cleared or unmounted before the delay ends", () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      const view = render(<Harness debounceMs={200} onChange={onChange} />, {
        wrapper: i18nWrapper(i18n),
      })
      const box = screen.getByRole("searchbox", { name: "Search units" })

      fireEvent.change(box, { target: { value: "dan" } })
      fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
      expect(onChange).toHaveBeenCalledExactlyOnceWith("")
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(onChange).toHaveBeenCalledExactlyOnceWith("")

      fireEvent.change(box, { target: { value: "ork" } })
      view.unmount()
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(onChange).toHaveBeenCalledExactlyOnceWith("")
    } finally {
      vi.useRealTimers()
    }
  })

  it("follows an outside value back to the one it last reported", () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      render(<Harness debounceMs={200} onChange={onChange} />, {
        wrapper: i18nWrapper(i18n),
      })
      const box = screen.getByRole("searchbox", { name: "Search units" })

      fireEvent.change(box, { target: { value: "dan" } })
      act(() => {
        vi.advanceTimersByTime(200)
      })
      fireEvent.click(screen.getByRole("button", { name: "Set ork" }))
      expect(box).toHaveValue("ork")
      fireEvent.click(screen.getByRole("button", { name: "Set dan" }))
      expect(box).toHaveValue("dan")
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(onChange).toHaveBeenCalledExactlyOnceWith("dan")
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("EmptyState", () => {
  it("announces its title, sentence and action", () => {
    render(
      <EmptyState
        actions={<button type="button">Clear filters</button>}
        description="Try fewer filters."
        title="No unit matches"
        variant="no-match"
      />
    )
    const state = screen.getByRole("status")
    expect(state).toHaveTextContent("No unit matchesTry fewer filters.")
    expect(state).toHaveAttribute("data-variant", "no-match")
    expect(
      screen.getByRole("button", { name: "Clear filters" })
    ).toBeInTheDocument()
  })

  it("leaves out the parts it is not given", () => {
    render(<EmptyState description="Nothing yet." />)
    const state = screen.getByRole("status")
    expect(state).toHaveTextContent("Nothing yet.")
    expect(state).toHaveAttribute("data-variant", "empty")
    expect(screen.queryByRole("button")).toBeNull()
  })
})
