import { Info } from "lucide-react"

/** A small info glyph whose text is the native tooltip (`title`) and its accessible name — for
 * helper copy that is useful but must not take a line of the compact dialogs. */
export function InfoHint({ text }: { text: string }) {
  return (
    <span
      aria-label={text}
      className="inline-flex text-muted-foreground"
      role="img"
      title={text}
    >
      <Info aria-hidden className="size-3.5" />
    </span>
  )
}
