import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { installForeignDomGuard } from "./foreign-dom-guard"

describe("installForeignDomGuard", () => {
  let uninstall: () => void
  let parent: HTMLDivElement
  let text: Text
  let font: HTMLElement

  beforeEach(() => {
    uninstall = installForeignDomGuard()
    // What Google Translate does: React's text node ends up inside a <font> it inserted.
    parent = document.createElement("div")
    text = document.createTextNode("hello")
    font = document.createElement("font")
    parent.append(font)
    font.append(text)
  })

  afterEach(() => uninstall())

  it("skips an insert whose reference node was moved instead of throwing", () => {
    const node = document.createElement("span")

    expect(parent.insertBefore(node, text)).toBe(node)
    expect(node.parentNode).toBeNull()
  })

  it("removes a moved child from its actual parent instead of throwing", () => {
    expect(parent.removeChild(text)).toBe(text)
    expect(text.parentNode).toBeNull()
  })

  it("leaves normal inserts and removals unchanged", () => {
    const node = document.createElement("span")

    parent.insertBefore(node, font)
    expect(parent.firstChild).toBe(node)
    parent.removeChild(node)
    expect(node.parentNode).toBeNull()
  })
})
