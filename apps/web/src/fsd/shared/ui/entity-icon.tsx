import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

/** An <img> that swaps to a fallback (or hides) when the source asset is missing. */
export function EntityIcon({
  src,
  fallback,
  alt,
  className,
}: {
  src?: string | null
  fallback?: string
  alt: string
  className?: string
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
      className={cn("object-contain", className)}
      onError={() => setErroredSrc(src ?? null)}
    />
  )
}
