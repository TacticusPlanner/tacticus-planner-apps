// DsThemeRoot — the preview-card theme wrapper. Wired as cfg.provider, so the
// converter wraps EVERY component preview (and floor card) render in it. Its
// only job is to make the design-system cards render on the DARK theme by
// default: it adds the `.dark` class to <html> (which flips every semantic
// token — shadcn themes by redefining the CSS vars under `.dark`, so an
// ancestor class is all that's needed) and paints the card surface with the
// dark `--background`/`--foreground` tokens. It also tints the converter's
// own grid chrome (cell borders/labels) so a multi-story card reads as one
// coherent dark surface instead of dark components on light scaffolding.
//
// Exported into window.TacticusUi via cfg.extraEntries — it is NOT part of the
// shipped @workspace/ui library.
import * as React from 'react'

const STYLE_ID = 'ds-theme-root-chrome'

export function DsThemeRoot({ children }: { children?: React.ReactNode }) {
  React.useLayoutEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.background = 'var(--background)'
    document.body.style.color = 'var(--foreground)'
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style')
      s.id = STYLE_ID
      // Re-tint the converter's grid scaffolding (hard-coded light greys in
      // the card html) to the dark token palette.
      s.textContent =
        '.ds-cell{border-color:var(--border)!important}' +
        '.ds-cell>h4{color:var(--muted-foreground)!important}'
      document.head.appendChild(s)
    }
  }, [])
  return React.createElement(React.Fragment, null, children)
}
