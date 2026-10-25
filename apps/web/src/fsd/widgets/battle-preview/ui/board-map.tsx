import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon, ImageOffIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/** The board image, or "Map not available" when no image ships for the id or it fails to load. */
function MapImage({
  src,
  mapId,
  alt,
}: {
  src: string | undefined
  mapId: string
  alt: string
}) {
  const { t } = useTranslation("legendaryEvents")
  // Track which src failed so the next battle's map is tried again.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  if (src === undefined || erroredSrc === src) {
    return (
      <div
        className="flex aspect-[296/408] w-full max-w-74 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground"
        data-map={mapId}
        data-testid="battle-map-unavailable"
      >
        <ImageOffIcon aria-hidden className="size-6" />
        {t("battles.map.unavailable")}
      </div>
    )
  }
  return (
    <img
      alt={alt}
      className="aspect-[296/408] w-full max-w-74 rounded-xl border object-cover"
      data-map={mapId}
      data-testid="battle-map-image"
      height={408}
      loading="lazy"
      onError={() => setErroredSrc(src)}
      src={src}
      width={296}
    />
  )
}

/**
 * A battle's board: shown beside the enemies on desktop, in a disclosure on mobile whose open state the
 * caller keeps across battles (collapsed by default, stays open on battle change). `src` is the
 * resolved image URL, undefined when none ships; `toggleLabel` defaults to "Map".
 */
export function BoardMap({
  src,
  mapId,
  alt,
  isMobile,
  open,
  onOpenChange,
  disclosureId,
  toggleLabel,
}: {
  src: string | undefined
  mapId: string
  alt: string
  isMobile: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  disclosureId: string
  toggleLabel?: string
}) {
  const { t } = useTranslation("legendaryEvents")
  if (!isMobile) {
    return (
      <div className="w-full md:w-74 md:shrink-0" data-testid="battle-map">
        <MapImage alt={alt} mapId={mapId} src={src} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2" data-testid="battle-map">
      <button
        aria-controls={disclosureId}
        aria-expanded={open}
        className="flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-medium"
        data-testid="battle-map-toggle"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        {toggleLabel ?? t("battles.map.toggle")}
        <ChevronDownIcon
          aria-hidden
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div hidden={!open} id={disclosureId}>
        {open ? <MapImage alt={alt} mapId={mapId} src={src} /> : null}
      </div>
    </div>
  )
}
