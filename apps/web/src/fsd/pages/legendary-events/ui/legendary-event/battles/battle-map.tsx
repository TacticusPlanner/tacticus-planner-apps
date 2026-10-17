import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon, ImageOffIcon } from "lucide-react"
import { legendaryEventMap } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

/** The map image, or "Map not available" when no image ships for the id or it fails to load. */
function MapImage({ mapId, alt }: { mapId: string; alt: string }) {
  const { t } = useTranslation("legendaryEvents")
  const src = legendaryEventMap(mapId)
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
 * The battle's map: shown beside the waves on desktop, in a "Map" disclosure on mobile whose open
 * state the section keeps across battles (spec: collapsed by default, stays open on battle change).
 */
export function BattleMap({
  mapId,
  alt,
  isMobile,
  open,
  onOpenChange,
}: {
  mapId: string
  alt: string
  isMobile: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  if (!isMobile) {
    return (
      <div className="w-full md:w-74 md:shrink-0" data-testid="battle-map">
        <MapImage alt={alt} mapId={mapId} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2" data-testid="battle-map">
      <button
        aria-controls="legendary-event-battle-map"
        aria-expanded={open}
        className="flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-medium"
        data-testid="battle-map-toggle"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        {t("battles.map.toggle")}
        <ChevronDownIcon
          aria-hidden
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div hidden={!open} id="legendary-event-battle-map">
        {open ? <MapImage alt={alt} mapId={mapId} /> : null}
      </div>
    </div>
  )
}
