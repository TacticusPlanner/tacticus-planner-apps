/** The top bar colour (`--topbar` in packages/ui globals.css) for each theme, as hex: the browser
 *  tints its toolbar, and an installed app its title bar, with `<meta name="theme-color">`. Keep in
 *  step with globals.css and with the inline script in index.html that sets it before first paint. */
export const THEME_COLORS = {
  light: "#FFFFFF",
  dark: "#191C23",
} as const

/** Points the page's theme-color meta at `theme`'s top bar colour, adding the tag when it is missing. */
export function applyThemeColor(theme: keyof typeof THEME_COLORS) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement("meta")
    meta.name = "theme-color"
    document.head.append(meta)
  }
  meta.content = THEME_COLORS[theme]
}
