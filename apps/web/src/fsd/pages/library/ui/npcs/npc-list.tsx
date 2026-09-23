import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { NpcPortrait } from "@/entities/npc"
import { EntityIcon } from "@/shared/ui"

import type { NpcListItem } from "./npcs-page.view-model"

/** Desktop tile grid of listed NPCs; the selected tile is pressed. */
export function NpcList({
  items,
  selectedId,
  onSelect,
  onClearFilters,
}: {
  items: NpcListItem[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  onClearFilters: () => void
}) {
  const { t } = useTranslation("library")
  const listRef = useRef<HTMLDivElement>(null)

  // A direct link can land on an NPC far down the grid; bring its tile into view once, on selection.
  useEffect(() => {
    if (!selectedId) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-testid="npc-tile-${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [selectedId])

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
        data-testid="npcs-no-matching"
      >
        <p>{t("npcs.noMatchingNpcs")}</p>
        <Button variant="outline" onClick={onClearFilters}>
          {t("npcs.clearFilters")}
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="flex flex-wrap gap-2"
      data-testid="npcs-list"
      aria-label={t("npcs.npc")}
    >
      {items.map((item) => {
        const emblem = factionIcon(item.factionId)
        const selected = item.id === selectedId
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            title={`${item.name} · ${item.factionName}`}
            className={cn(
              "flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors",
              "hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary",
              selected ? "border-primary bg-accent" : "border-border"
            )}
            data-testid={`npc-tile-${item.id}`}
          >
            <span className="relative">
              <NpcPortrait
                variationId={item.portraitVariationId}
                name={item.name}
                className="size-14"
              />
              {emblem ? (
                <EntityIcon
                  src={emblem}
                  alt={item.factionName}
                  className="absolute -right-1 -bottom-1 size-5 rounded-full bg-background p-0.5"
                />
              ) : null}
            </span>
            <span className="line-clamp-2 text-xs font-medium">
              {item.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
