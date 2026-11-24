import { Info } from "lucide-react"

import { HintTrigger } from "@/shared/ui"

/** A small info glyph whose text is its accessible name and its hint (a tooltip with a mouse, a
 * popover on touch) — for helper copy that is useful but must not take a line of the compact
 * dialogs. */
export function InfoHint({ text }: { text: string }) {
  return (
    <HintTrigger className="text-muted-foreground" label={text}>
      <Info aria-hidden className="size-icon-sm" />
    </HintTrigger>
  )
}
