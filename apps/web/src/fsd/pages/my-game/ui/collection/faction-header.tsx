import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { CollectionFactionGroup } from "../../model/collection-view"

/**
 * A faction group's header bar, shared by the Cards and Roster views: the faction colour, icon and
 * name, and the owned/total count once a roster is available.
 */
export function FactionHeader({
  group,
  showOwned,
}: {
  group: CollectionFactionGroup
  showOwned: boolean
}) {
  const { t } = useTranslation("common")
  const total = group.total

  return (
    <header
      className="flex h-[30px] shrink-0 items-center gap-2 px-2.5 text-overlay-foreground"
      style={{
        background: `var(--faction-${group.factionId}, var(--muted-foreground))`,
      }}
      data-testid="collection-faction-header"
    >
      <EntityIcon
        src={factionIcon(group.factionId)}
        alt=""
        className="size-[22px] shrink-0"
      />
      <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-[0.06em] uppercase">
        {group.factionName}
      </h2>
      {showOwned ? (
        <span
          className="shrink-0 text-[13px] font-semibold tabular-nums"
          aria-label={t("myGame.collection.factionOwned", {
            owned: group.owned,
            total,
          })}
          data-testid="collection-faction-owned"
        >
          {group.owned}/{total}
        </span>
      ) : null}
    </header>
  )
}
