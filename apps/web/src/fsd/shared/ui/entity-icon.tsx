import { useState } from "react"
import type { GameIcon, LayeredIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

/** An <img> that swaps to a fallback (or hides) when the source asset is missing. Pass the intrinsic
 *  `width`/`height` when the CSS does not fix both dimensions (e.g. `h-4 w-auto`), so the box is
 *  reserved before the image loads. A layered icon renders its sprites stacked in a square box. */
export function EntityIcon({
  src,
  fallback,
  alt,
  className,
  width,
  height,
}: {
  src?: GameIcon | null
  fallback?: string
  alt: string
  className?: string
  width?: number
  height?: number
}) {
  // Track which src failed (rather than a boolean reset by an effect) so a new src is retried for free.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)

  if (src && typeof src === "object") {
    return <LayeredEntityIcon icon={src} alt={alt} className={className} />
  }

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

function LayeredEntityIcon({
  icon,
  alt,
  className,
}: {
  icon: LayeredIcon
  alt: string
  className?: string
}) {
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("relative inline-block aspect-square shrink-0", className)}
    >
      {icon.layers.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          loading="lazy"
          className="absolute max-w-none"
          style={{
            left: `${layer.left}%`,
            top: `${layer.top}%`,
            width: `${layer.width}%`,
            height: `${layer.height}%`,
          }}
        />
      ))}
    </span>
  )
}
