import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  buildNpcTierList,
  npcEventIds,
  useLegendaryEvents,
  useLegendaryEventsBattles,
  useNpcTiers,
  type NpcTierTile,
} from "@/entities/legendary-event"
import { NpcPortrait, useNpcLabels } from "@/entities/npc"
import { useUnitName } from "@/shared/unit-name"

import { useNpcThreatText } from "../../model/use-npc-threat-text"
import {
  activeEventIds,
  npcTierListSearchParams,
  parseNpcTierListFilters,
  type NpcTierListUrlFilters,
} from "./npc-tier-list.view-model"
import { formatMultiplier } from "./tier-list.view-model"
import { TierRow } from "./tier-row"

/**
 * The Enemies view of the Tier List: every enemy NPC of the active Legendary Events, one row per
 * catalog `npc-tiers` tier with each NPC's multiplier on its power in the clear estimates, then the
 * untiered ones; filtered by event and name (kept in the URL query).
 */
export function NpcTierListView() {
  // `npcThreats` loads with the view so opening a tile never suspends.
  const { t, i18n } = useTranslation(["legendaryEvents", "npcThreats"])
  const isMobile = useIsMobile()
  const events = useLegendaryEvents()
  const tiers = useNpcTiers()
  const unitName = useUnitName()
  const { variationName } = useNpcLabels()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseNpcTierListFilters(searchParams)

  const eventIds =
    events.status === "ready" ? activeEventIds(events.data, events.nowMs) : []
  const battles = useLegendaryEventsBattles(eventIds)
  const nameOf = (npcId: string) => variationName(npcId, npcId)
  const eventName = (eventId: string) => unitName("Character", eventId)
  const format = (value: number) => formatMultiplier(value, i18n.language)

  const changeFilters = (patch: Partial<NpcTierListUrlFilters>) =>
    setSearchParams(
      (current) =>
        npcTierListSearchParams(current, {
          ...parseNpcTierListFilters(current),
          ...patch,
        }),
      { replace: true }
    )

  if (
    events.status === "error" ||
    battles.status === "error" ||
    tiers.status === "error"
  ) {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="npc-tier-list-error"
      >
        <p className="text-sm text-destructive">{t("npcTierList.error")}</p>
        <Button
          onClick={() => {
            if (events.status === "error") events.retry()
            if (battles.status === "error") battles.retry()
            if (tiers.status === "error") tiers.retry()
          }}
          variant="outline"
        >
          {t("tierList.retry")}
        </Button>
      </div>
    )
  }
  if (
    events.status !== "ready" ||
    battles.status !== "ready" ||
    tiers.status !== "ready"
  ) {
    return (
      <div className="flex flex-col gap-3" data-testid="npc-tier-list-loading">
        <span className="sr-only">{t("tierList.loading")}</span>
        {["S", "A", "B", "C", "D"].map((key) => (
          <Skeleton className="h-20 w-full rounded-xl" key={key} />
        ))}
      </div>
    )
  }
  if (eventIds.length === 0) {
    return (
      <p
        className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
        data-testid="npc-tier-list-no-event"
      >
        {t("npcTierList.noActiveEvent")}
      </p>
    )
  }

  const eventId = eventIds.includes(filters.eventId) ? filters.eventId : "all"
  const list = buildNpcTierList(
    tiers.data,
    npcEventIds(Object.values(battles.data).flat(), new Set(eventIds)),
    { query: filters.query, eventId },
    nameOf,
    i18n.language
  )
  const tile = (view: NpcTierTile, tier: string | null) => (
    <li className="min-w-0" key={view.npcId}>
      <NpcTile
        isMobile={isMobile}
        name={nameOf(view.npcId)}
        tier={tier}
        tile={view}
      />
    </li>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="npc-tier-list">
      <p className="text-sm text-muted-foreground">{t("npcTierList.intro")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t("npcTierList.search")}
          className="w-full sm:w-64"
          data-testid="npc-tier-list-search"
          onChange={(event) => changeFilters({ query: event.target.value })}
          placeholder={t("npcTierList.search")}
          type="search"
          value={filters.query}
        />
        <Select
          onValueChange={(value) => changeFilters({ eventId: value })}
          value={eventId}
        >
          <SelectTrigger
            aria-label={t("npcTierList.event")}
            className="w-full sm:w-56"
            data-testid="npc-tier-list-event"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("npcTierList.allEvents")}</SelectItem>
            {eventIds.map((id) => (
              <SelectItem key={id} value={id}>
                {eventName(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {list.rows.map((row) => (
          <TierRow
            emptyLabel={t("npcTierList.noEnemy")}
            isEmpty={row.npcs.length === 0}
            isMobile={isMobile}
            key={row.tier}
            multiplier={format(row.multiplier)}
            name={row.tier}
            testId={`npc-tier-list-row-${row.tier}`}
            tone={row.tier}
          >
            {row.npcs.map((view) => tile(view, row.tier))}
          </TierRow>
        ))}
        {list.untiered.length > 0 ? (
          <TierRow
            isEmpty={false}
            isMobile={isMobile}
            multiplier={format(1)}
            name={t("tierList.untiered")}
            testId="npc-tier-list-untiered"
            tone={undefined}
          >
            {list.untiered.map((view) => tile(view, null))}
          </TierRow>
        ) : null}
      </div>
    </div>
  )
}

/** One NPC: portrait, localized name and its multiplier (marked when it overrides its tier's).
 *  Activating it opens its details (tier, multiplier, why it is dangerous) in a popover on desktop
 *  and a bottom sheet on mobile. */
function NpcTile({
  tile,
  tier,
  name,
  isMobile,
}: {
  tile: NpcTierTile
  tier: string | null
  name: string
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const multiplier = formatMultiplier(tile.multiplier, i18n.language)
  const trigger = (
    <button
      aria-label={t("npcTierList.tileLabel", { name, multiplier })}
      className="flex w-full min-w-0 flex-col items-center gap-1 rounded-lg p-1 text-center hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      data-npc={tile.npcId}
      data-testid="npc-tier-tile"
      type="button"
    >
      <NpcPortrait
        className={isMobile ? "size-12" : "size-14"}
        name={name}
        variationId={tile.npcId}
      />
      <span className="line-clamp-2 w-16 text-xs leading-tight">{name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {multiplier}
        {tile.overridden ? "*" : ""}
      </span>
    </button>
  )
  const details = (
    <NpcTileDetails multiplier={multiplier} npcId={tile.npcId} tier={tier} />
  )
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent data-testid="npc-tier-sheet" side="bottom">
          <SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("npcTierList.details.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">{details}</div>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" data-testid="npc-tier-popover">
        <p className="mb-2 font-medium">{name}</p>
        {details}
      </PopoverContent>
    </Popover>
  )
}

/** An NPC's tier, multiplier and threat text (why it is dangerous, how to deal with it). */
function NpcTileDetails({
  npcId,
  tier,
  multiplier,
}: {
  npcId: string
  tier: string | null
  multiplier: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const threatText = useNpcThreatText()
  const text = threatText(npcId)
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="npc-tier-details">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">{t("tierList.details.tier")}</dt>
        <dd>{tier ?? t("tierList.untiered")}</dd>
        <dt className="text-muted-foreground">
          {t("tierList.details.multiplier")}
        </dt>
        <dd className="tabular-nums">{multiplier}</dd>
      </dl>
      {text.threat ? (
        <div className="flex flex-col gap-0.5" data-testid="npc-tier-threat">
          <h3 className="font-medium">{t("npcTierList.details.threat")}</h3>
          <p className="text-muted-foreground">{text.threat}</p>
        </div>
      ) : (
        <p className="text-muted-foreground" data-testid="npc-tier-no-threat">
          {t("npcTierList.details.noThreat")}
        </p>
      )}
      {text.counter ? (
        <div className="flex flex-col gap-0.5" data-testid="npc-tier-counter">
          <h3 className="font-medium">{t("npcTierList.details.counter")}</h3>
          <p className="text-muted-foreground">{text.counter}</p>
        </div>
      ) : null}
    </div>
  )
}
