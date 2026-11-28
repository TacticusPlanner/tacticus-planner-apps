import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { NpcPortrait } from "@/entities/npc"
import { EmptyState, EntityIcon, TruncatedText } from "@/shared/ui"

import { npcListSections } from "../../model/npcs/npcs-page.view-model"
import type { NpcListItem } from "../../model/npcs/npcs-page.view-model"

/** The listed NPCs in two sections, Enemies then Playable characters; each tile opens that NPC's page. */
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

  const { enemies, playable } = npcListSections(items)
  return (
    <div
      className="flex flex-col gap-6"
      data-testid="npcs-list"
      aria-label={t("npcs.npc")}
    >
      {enemies.length > 0 ? (
        <NpcSection
          items={enemies}
          testId="npcs-section-enemies"
          title={t("npcs.sections.enemies")}
        />
      ) : null}
      {playable.length > 0 ? (
        <NpcSection
          items={playable}
          testId="npcs-section-playable"
          title={t("npcs.sections.playable")}
        />
      ) : null}
    </div>
  )
}

function NpcSection({
  items,
  testId,
  title,
}: {
  items: NpcListItem[]
  testId: string
  title: string
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3"
      data-testid={testId}
    >
      <h2 className="text-sm font-medium">
        {title}{" "}
        <span className="text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NpcTile item={item} key={item.id} />
        ))}
      </div>
    </section>
  )
}

function NpcTile({ item }: { item: NpcListItem }) {
  const emblem = factionIcon(item.factionId)
  return (
    <Link
      to={`/library/npcs/${item.id}`}
      className="flex w-24 flex-col items-center gap-1.5 rounded-lg border interactive-surface p-2 text-center"
      data-testid={`npc-tile-${item.id}`}
    >
      <span className="relative">
        <NpcPortrait
          variationId={item.portraitVariationId}
          characterId={item.characterId}
          name={item.name}
          size="portrait-md"
        />
        {emblem ? (
          <EntityIcon
            size="icon"
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
}
