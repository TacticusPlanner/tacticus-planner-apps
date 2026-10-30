import { describe, expect, it } from "vitest"

import manifestText from "../../../../../public/site.webmanifest?raw"
import { APP_SHORTCUTS } from "./app-shortcuts"

type ManifestShortcut = { url: string; icons: { src: string }[] }

const shortcutIcons = Object.keys(
  import.meta.glob("../../../../../public/shortcuts/*.png")
).map((path) => path.replace("../../../../../public", ""))

describe("APP_SHORTCUTS", () => {
  const manifest = JSON.parse(manifestText) as {
    shortcuts: ManifestShortcut[]
  }

  it("matches the manifest's shortcuts, in order", () => {
    expect(
      manifest.shortcuts.map((shortcut) => ({
        url: shortcut.url,
        iconSrc: shortcut.icons[0]?.src,
      }))
    ).toEqual(APP_SHORTCUTS.map(({ url, iconSrc }) => ({ url, iconSrc })))
  })

  it("points at icons that exist", () => {
    for (const { iconSrc } of APP_SHORTCUTS) {
      expect(shortcutIcons).toContain(iconSrc)
    }
  })
})
