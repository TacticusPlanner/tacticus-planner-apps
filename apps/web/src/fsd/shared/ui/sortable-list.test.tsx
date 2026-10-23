import { describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor } from "@/test/render"

import { SortableList } from "./sortable-list"

const names: Record<string, string> = { a: "Calgar", b: "Ragnar" }

async function renderList(language: string) {
  const i18n = await createTestI18n()
  await i18n.changeLanguage(language)
  render(
    <ul>
      <SortableList
        getId={(id) => id}
        getLabel={(id) => names[id] ?? ""}
        items={["a", "b"]}
        onReorder={vi.fn()}
        renderItem={(id, { setNodeRef, style, dragHandle }) => (
          <li ref={setNodeRef} style={style}>
            <button
              ref={dragHandle.ref}
              type="button"
              {...dragHandle.attributes}
              {...dragHandle.listeners}
            >
              {names[id]}
            </button>
          </li>
        )}
      />
    </ul>,
    { wrapper: i18nWrapper(i18n) }
  )
}

function pickUp(name: string) {
  const handle = screen.getByRole("button", { name })
  handle.focus()
  fireEvent.keyDown(handle, { key: " ", code: "Space" })
}

describe("SortableList announcements", () => {
  it("announces a keyboard pick-up in German, naming the row and its position", async () => {
    await renderList("de")
    pickUp("Calgar")

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Calgar aufgenommen. Position 1 von 2."
      )
    )
  })

  it("falls back to English for a locale without translations", async () => {
    await renderList("pt")
    pickUp("Calgar")

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Picked up Calgar. It is at position 1 of 2."
      )
    )
  })

  it("gives the drag handle localized screen-reader instructions", async () => {
    await renderList("de")

    expect(
      screen.getByRole("button", { name: "Calgar" })
    ).toHaveAccessibleDescription(/Drücke Leertaste oder Eingabe/)
  })
})
