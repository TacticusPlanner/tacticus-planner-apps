import { describe, expect, it } from "vitest"

import type { HseText } from "@/entities/home-screen-event"

import { renderHseText } from "./use-hse-text"

const labels: Record<string, string> = {
  line: "Excepto {{list}}",
  chaos: "Caos",
  imperial: "Imperial",
  xenos: "Xenos",
}
const translate = (key: string, options: Record<string, unknown>) =>
  (labels[key] ?? key).replace(
    "{{list}}",
    typeof options.list === "string" ? options.list : ""
  )

const line = (keys: string[]): HseText => ({
  key: "line",
  values: { list: { list: keys.map((key) => ({ key })), join: "and" } },
})

// Stands in a marker for each label, as the rich form does, then swaps the labels back.
function renderMarked(root: HseText): string {
  const marked: string[] = []
  const out = renderHseText(translate, "es", root, (_text, label) => {
    marked.push(label)
    return `<${marked.length - 1}>`
  })
  return out.replaceAll(/<(\d+)>/g, (_match, index: string) => {
    return marked[Number(index)] ?? ""
  })
}

describe("renderHseText", () => {
  it("picks the Spanish conjunction from the real labels when markers stand in", () => {
    const root = line(["chaos", "imperial"])
    expect(renderHseText(translate, "es", root)).toBe("Excepto Caos e Imperial")
    expect(renderMarked(root)).toBe("Excepto Caos e Imperial")
  })

  it("renders an ordinary list the same with or without markers", () => {
    const root = line(["chaos", "xenos"])
    expect(renderHseText(translate, "es", root)).toBe("Excepto Caos y Xenos")
    expect(renderMarked(root)).toBe("Excepto Caos y Xenos")
  })
})
