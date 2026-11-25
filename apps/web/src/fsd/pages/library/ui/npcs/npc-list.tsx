import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { NpcPortrait } from "@/entities/npc"
import { EmptyState, EntityIcon, TruncatedText } from "@/shared/ui"

import type { NpcListItem } from "./npcs-page.view-model"

/** The grid of listed NPCs; each tile opens that NPC's page. */
export function NpcList({
  items,
  onClearFilters,
}: {
  items: NpcListItem[]
  onClearFilters: () => void
}) {
  const { t } = useTranslation("library")

  if (items.length === 0) {
    return (
      <EmptyState
        actions={
          <Button variant="outline" onClick={onClearFilters}>
            {t("npcs.clearFilters")}
          </Button>
        }
        description={t("npcs.noMatchingNpcs")}
        testId="npcs-no-matching"
        variant="no-match"
      />
    )
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      data-testid="npcs-list"
      aria-label={t("npcs.npc")}
    >
      {items.map((item) => {
        const emblem = factionIcon(item.factionId)
        return (
          <Link
            key={item.id}
            to={`/library/npcs/${item.id}`}
            className="flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary"
            data-testid={`npc-tile-${item.id}`}
          >
            <span className="relative">
              <NpcPortrait
                variationId={item.portraitVariationId}
                name={item.name}
                size="portrait-md"
              />
              {emblem ? (
                <EntityIcon
                  size="badge-md"
                  src={emblem}
                  alt={item.factionName}
                  className="absolute -right-1 -bottom-1 rounded-full bg-background p-0.5"
                />
              ) : null}
            </span>
            <TruncatedText className="text-xs font-medium" lines={2}>
              {item.name}
            </TruncatedText>
          </Link>
        )
      })}
    </div>
  )
}
