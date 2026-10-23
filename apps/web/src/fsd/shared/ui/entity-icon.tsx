import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

/** An <img> that swaps to a fallback (or hides) when the source asset is missing. Pass the intrinsic
 *  `width`/`height` when the CSS does not fix both dimensions (e.g. `h-4 w-auto`), so the box is
 *  reserved before the image loads. */
export function EntityIcon({
  src,
  fallback,
  alt,
  className,
  width,
  height,
}: {
  src?: string | null
  fallback?: string
  alt: string
  className?: string
  width?: number
  height?: number
}) {
  // Track which src failed (rather than a boolean reset by an effect) so a new src is retried for free.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)

  const resolved = src && erroredSrc !== src ? src : fallback
  if (!resolved) return null

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      onError={() => setErroredSrc(src ?? null)}
    />
  )
}
