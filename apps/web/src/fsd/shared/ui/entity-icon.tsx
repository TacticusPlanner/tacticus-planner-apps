import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ImageOff, Shield, Sparkles, UserRound } from "lucide-react"
import type { GameIcon, LayeredIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import {
  type IconPlaceholderKind,
  placeholderKindForIcon,
} from "./entity-icon-placeholder"

/** An <img> that swaps to a fallback image, or else to a placeholder glyph sized like the icon, when
 *  the source asset is missing (a new unit the datamine ships no art for yet). No `src` at all still
 *  renders nothing: that means the entity has no icon by design. Pass the intrinsic `width`/`height`
 *  when the CSS does not fix both dimensions (e.g. `h-4 w-auto`), so the box is reserved before the
 *  image loads. A layered icon renders its sprites stacked in a square box. */
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

  if (!src && !fallback) return null
  const resolved = src && erroredSrc !== src ? src : fallback
  if (!resolved) {
    return (
      <IconPlaceholder
        kind={placeholderKindForIcon(src ?? "")}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    )
  }

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

const placeholderGlyphs: Record<IconPlaceholderKind, LucideIcon> = {
  unit: UserRound,
  ability: Sparkles,
  trait: Shield,
  generic: ImageOff,
}

function IconPlaceholder({
  kind,
  alt,
  className,
  width,
  height,
}: {
  kind: IconPlaceholderKind
  alt: string
  className?: string
  width?: number
  height?: number
}) {
  const Glyph = placeholderGlyphs[kind]
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      data-icon-placeholder={kind}
      style={width && height ? { width, height } : undefined}
      className={cn(
        "inline-flex aspect-square shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground",
        className,
        // The game's portrait sprites are circles, so a unit placeholder stays round whatever the
        // caller's box shape is.
        kind === "unit" && "rounded-full"
      )}
    >
      <Glyph aria-hidden className="size-3/5" />
    </span>
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
