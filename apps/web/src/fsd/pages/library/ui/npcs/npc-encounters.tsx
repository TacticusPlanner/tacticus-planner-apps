import { useCallback, useState, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import {
  type EventsCalendarStorageModel,
  type NpcEncounterBattle,
  type NpcEncounterSource,
} from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import {
  NPC_ENCOUNTER_SOURCES,
  NpcLevelBadge,
  NpcPortrait,
  collapseRanges,
  encounterPlaces,
  encounterTiming,
  npcLibraryHref,
  npcsAtPlace,
  useNpcLabels,
  useNpcsById,
  type EncounterPlace,
  type EncounterPlaceIndex,
  type EncounterTiming,
  type NpcEncounter,
} from "@/entities/npc"
import { RARITY_TEXT } from "@/entities/incursion"
import { useMinuteNow } from "@/entities/legendary-event"
import { formatEstimateDate, useDateLocale } from "@/shared/lib"

import { useEncounterGroupName } from "./hooks/use-encounter-group-name"
import { useIncursionTierNames } from "./hooks/use-incursion-tier-names"
import type { NpcsPageViewProps } from "./npcs-page.view-model"

// Where a group links to, when the planner has a page for it (spec: Quest Event and Survival have none).
const LINKS: Partial<Record<NpcEncounterSource, (groupId: string) => string>> =
  {
    campaign: () => "/my-game/campaigns",
    campaignEvent: () => "/my-game/campaign-events",
    legendaryEvent: (groupId) => `/legendary-events/${groupId}`,
    incursion: (groupId) => `/my-game/incursions/${groupId}`,
    guildRaid: (groupId) => `/library/raid-bosses/${groupId}`,
    onslaught: () => "/my-game/onslaught",
  }

/** A sub-heading inside a row: an Incursion tier or an event track, with the places under it. */
type PlaceGroup = {
  key: string
  label: string
  labelClassName?: string
  detail: string
  places: readonly EncounterPlace[]
}

const TRACK_ORDER = ["Standard", "Extremis", "alpha", "beta", "gamma"]

/** "3, 7, 12–14" from a list of numbers. */
function formatNumberList(numbers: readonly number[]): string {
  return collapseRanges(numbers)
    .map(([from, to]) => (from === to ? `${from}` : `${from}–${to}`))
    .join(", ")
}

function numbersOf(battles: readonly NpcEncounterBattle[]): number[] {
  return battles.flatMap((battle) =>
    battle.number === null ? [] : [battle.number]
  )
}

/** Battles split by track, in track order, each with its regular and challenge numbers. */
function byTrack(battles: readonly NpcEncounterBattle[]) {
  const tracks = new Map<string, NpcEncounterBattle[]>()
  for (const battle of battles) {
    const track = battle.track ?? ""
    tracks.set(track, [...(tracks.get(track) ?? []), battle])
  }
  return [...tracks.entries()]
    .sort(([a], [b]) => TRACK_ORDER.indexOf(a) - TRACK_ORDER.indexOf(b))
    .map(([track, list]) => ({
      track,
      regular: numbersOf(list.filter((battle) => !battle.challenge)),
      challenge: numbersOf(list.filter((battle) => battle.challenge)),
    }))
}

/**
 * Incursion battles merged by tier: tiers whose battle sets are identical share one entry, so a unit that
 * fights in the same battles of every tier reads "Tiers 1–14: battles 1–3". Tiers are shown 1-based.
 */
function incursionTiers(battles: readonly NpcEncounterBattle[]) {
  const byTier = new Map<number, number[]>()
  for (const battle of battles) {
    if (battle.tier === null) continue
    const id = Number(battle.battleId)
    byTier.set(battle.tier, [
      ...(byTier.get(battle.tier) ?? []),
      ...(Number.isFinite(id) ? [id] : []),
    ])
  }
  const bySet = new Map<string, number[]>()
  for (const [tier, ids] of [...byTier.entries()].sort(([a], [b]) => a - b)) {
    const key = formatNumberList(ids)
    bySet.set(key, [...(bySet.get(key) ?? []), tier + 1])
  }
  return [...bySet.entries()].map(([battles, tiers]) => ({ tiers, battles }))
}

/** Places under their group key, in order of first appearance. */
function groupPlaces(
  places: readonly EncounterPlace[],
  keyOf: (place: EncounterPlace) => string
) {
  const groups = new Map<string, EncounterPlace[]>()
  for (const place of places) {
    const key = keyOf(place)
    groups.set(key, [...(groups.get(key) ?? []), place])
  }
  return [...groups.entries()]
}

function useEncounterText() {
  const { t } = useTranslation("library")
  const tierName = useIncursionTierNames()
  const dateLocale = useDateLocale()

  const groupName = useEncounterGroupName()

  const location = useCallback(
    (encounter: NpcEncounter): string => {
      const { battles } = encounter
      const list = (numbers: readonly number[]) => formatNumberList(numbers)
      const trackParts = () =>
        byTrack(battles)
          .map(({ track, regular, challenge }) => {
            const label = t(`npcs.encounters.tracks.${track}`, {
              defaultValue: track,
            })
            const parts = [
              regular.length > 0 ? list(regular) : null,
              challenge.length > 0
                ? t("npcs.encounters.challenge", { list: list(challenge) })
                : null,
            ].filter(Boolean)
            return `${label} ${parts.join(", ")}`
          })
          .join(" · ")

      switch (encounter.source) {
        case "campaign":
        case "questEvent": {
          const regular = numbersOf(battles.filter((b) => !b.challenge))
          const challenge = numbersOf(battles.filter((b) => b.challenge))
          return [
            regular.length > 0
              ? t("npcs.encounters.battles", { list: list(regular) })
              : null,
            challenge.length > 0
              ? t("npcs.encounters.challenge", { list: list(challenge) })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        case "campaignEvent":
        case "legendaryEvent":
          return trackParts()
        case "incursion":
          return incursionTiers(battles)
            .map(({ tiers, battles: ids }) => {
              // "Common 1 – Uncommon 2" when every tier has a rarity name, else the tier numbers.
              const names = collapseRanges(tiers).map(([from, to]) => {
                const first = tierName(encounter.groupId, from - 1)?.name
                const last = tierName(encounter.groupId, to - 1)?.name
                if (!first || !last) return null
                return from === to ? first : `${first} – ${last}`
              })
              return names.every(Boolean)
                ? t("npcs.encounters.tierRangeBattles", {
                    tiers: names.join(", "),
                    battles: ids,
                  })
                : t("npcs.encounters.tierBattles", {
                    count: tiers.length,
                    tiers: list(tiers),
                    battles: ids,
                  })
            })
            .join(" · ")
        case "guildRaid": {
          const role = battles[0]?.role ?? "enemy"
          return role === "enemy"
            ? t("npcs.encounters.alongside")
            : t(`npcs.encounters.${role}`)
        }
        case "survival":
          return t("npcs.encounters.rounds", {
            list: list(battles.flatMap((b) => b.rounds)),
          })
        case "onslaught":
          return t("npcs.encounters.canAppear", {
            list: list(numbersOrTiers(battles)),
          })
      }
    },
    [t, tierName]
  )

  const placeLabel = useCallback(
    (source: NpcEncounterSource, place: EncounterPlace): string => {
      const { battle, round } = place
      const number = `${battle.number ?? ""}`
      const battleLabel = battle.challenge
        ? t("npcs.encounters.challenge", { list: number })
        : t("npcs.encounters.battle", { number })
      switch (source) {
        // Event battles are listed under their track, so the battle alone identifies them.
        case "campaign":
        case "questEvent":
        case "campaignEvent":
        case "legendaryEvent":
          return battleLabel
        case "incursion":
          // Listed under its tier, so the battle alone identifies it.
          return battle.challenge
            ? t("npcs.encounters.challenge", { list: battle.battleId })
            : t("npcs.encounters.battle", { number: battle.battleId })
        case "survival":
          return t("npcs.encounters.round", { number: round })
        case "onslaught":
          return t("npcs.encounters.tier", { number: battle.tier })
        case "guildRaid":
          return ""
      }
    },
    [t]
  )

  /** The sub-headings of a row's places, or `null` for a source that lists them flat. */
  const placeGroups = useCallback(
    (
      encounter: NpcEncounter,
      places: readonly EncounterPlace[]
    ): PlaceGroup[] | null => {
      const numbers = (group: readonly EncounterPlace[], challenge: boolean) =>
        formatNumberList(
          group.flatMap(({ battle }) => {
            const id = battle.number ?? Number(battle.battleId)
            return battle.challenge === challenge && Number.isFinite(id)
              ? [id]
              : []
          })
        )
      const detail = (group: readonly EncounterPlace[]) => {
        const regular = numbers(group, false)
        const challenge = numbers(group, true)
        return [
          regular ? t("npcs.encounters.battles", { list: regular }) : null,
          challenge
            ? t("npcs.encounters.challenge", { list: challenge })
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      }

      switch (encounter.source) {
        case "incursion":
          return groupPlaces(places, ({ battle }) => `${battle.tier ?? 0}`).map(
            ([key, group]) => {
              const tier = tierName(encounter.groupId, Number(key))
              return {
                key,
                label:
                  tier?.name ??
                  t("npcs.encounters.tier", { number: Number(key) + 1 }),
                labelClassName: tier && RARITY_TEXT[tier.rarity],
                detail: detail(group),
                places: group,
              }
            }
          )
        case "campaignEvent":
        case "legendaryEvent":
          return groupPlaces(places, ({ battle }) => battle.track ?? "")
            .sort(([a], [b]) => TRACK_ORDER.indexOf(a) - TRACK_ORDER.indexOf(b))
            .map(([key, group]) => ({
              key,
              label: t(`npcs.encounters.tracks.${key}`, { defaultValue: key }),
              detail: detail(group),
              places: group,
            }))
        default:
          return null
      }
    },
    [t, tierName]
  )

  const timing = useCallback(
    (value: EncounterTiming | null): string | null => {
      if (!value) return null
      switch (value.kind) {
        case "next":
          return t("npcs.encounters.timing.next", {
            date:
              formatEstimateDate(value.startUtc.slice(0, 10), dateLocale) ??
              value.startUtc.slice(0, 10),
          })
        default:
          return t(`npcs.encounters.timing.${value.kind}`)
      }
    },
    [dateLocale, t]
  )

  return { groupName, location, placeGroups, placeLabel, timing }
}

function numbersOrTiers(battles: readonly NpcEncounterBattle[]): number[] {
  return battles.flatMap((battle) =>
    battle.tier === null ? [] : [battle.tier]
  )
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <ChevronDownIcon
      aria-hidden
      className={cn(
        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
        open && "rotate-180",
        className
      )}
    />
  )
}

/**
 * Everyone fought at one place, one chip per NPC and level. A chip opens that variation at that level in the
 * Library, the selected NPC's included (it is only marked), so a battle's stats are one click away. A Guild Raid
 * names no level, so its chips open the variation.
 */
function PlaceNpcs({
  encounter,
  placeKey,
  places,
  testId,
}: {
  encounter: NpcEncounter
  placeKey: string
  places: EncounterPlaceIndex
  testId: string
}) {
  const { t } = useTranslation("library")
  const npcs = useNpcsById()
  const { variationName } = useNpcLabels()

  return (
    <ul className="flex flex-wrap gap-1.5" data-testid={testId}>
      {npcsAtPlace(places, encounter, placeKey).flatMap(
        ({ npcId: id, count: npcCount, levels }) => {
          const npc = npcs.status === "ready" ? npcs.data.get(id) : undefined
          const name = variationName(id, npc?.name ?? id)
          const current = id === encounter.npcId
          const chips =
            levels.length > 0
              ? levels
              : [{ servedIndex: null, count: npcCount }]

          return chips.map(({ servedIndex, count }) => {
            const row =
              servedIndex === null ? undefined : npc?.stats[servedIndex]
            const href = npc
              ? npcLibraryHref(
                  npc,
                  row ? (servedIndex ?? undefined) : undefined
                )
              : undefined
            // A tier's waves are alternatives, so an Onslaught count is a ceiling, not a total.
            const countLabel =
              count === null
                ? null
                : t(
                    encounter.source === "onslaught"
                      ? "npcs.encounters.upTo"
                      : "npcs.encounters.count",
                    { number: count }
                  )
            const chip = cn(
              "flex max-w-full min-w-0 items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-xs",
              current && "border-primary font-medium",
              href && "hover:bg-muted"
            )
            const content: ReactNode = (
              <>
                <NpcPortrait variationId={id} name={name} className="size-6" />
                <span className="min-w-0 truncate">{name}</span>
                {row ? (
                  <NpcLevelBadge row={row} className="shrink-0 gap-1" />
                ) : null}
                {countLabel ? (
                  <span
                    className="shrink-0 font-semibold text-muted-foreground tabular-nums"
                    data-testid="npc-encounter-count"
                  >
                    {countLabel}
                  </span>
                ) : null}
              </>
            )
            return (
              <li key={`${id}:${servedIndex}`} className="min-w-0" title={id}>
                {href ? (
                  <Link
                    to={href}
                    className={chip}
                    aria-current={current ? "true" : undefined}
                    preventScrollReset
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={chip}
                    aria-current={current ? "true" : undefined}
                  >
                    {content}
                  </span>
                )}
              </li>
            )
          })
        }
      )}
    </ul>
  )
}

/** One row of a location list, opening to its content. `detail` sums it up while it is closed. */
function DisclosureRow({
  label,
  labelClassName,
  detail,
  defaultOpen = false,
  testId,
  children,
}: {
  label: string
  labelClassName?: string
  detail?: string
  defaultOpen?: boolean
  testId: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <li className={cn("rounded-md", open && "bg-muted/50")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-muted/50"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        data-testid={testId}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={cn("min-w-0 break-words", labelClassName)}>
            {label}
          </span>
          {detail ? (
            <span className="min-w-0 text-xs break-words text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </span>
        <Chevron open={open} />
      </button>
      {open ? <div className="px-2 pt-1 pb-2">{children}</div> : null}
    </li>
  )
}

function PlaceRow({
  encounter,
  place,
  places,
  label,
  testId,
}: {
  encounter: NpcEncounter
  place: EncounterPlace
  places: EncounterPlaceIndex
  label: string
  testId: string
}) {
  return (
    <DisclosureRow label={label} testId={testId}>
      <PlaceNpcs
        encounter={encounter}
        placeKey={place.key}
        places={places}
        testId={`${testId}-npcs`}
      />
    </DisclosureRow>
  )
}

/**
 * A row's places under their tiers or tracks, each opening to its battles. A row with one group opens it
 * straight away, because there is nothing to choose between.
 */
function GroupedPlaces({
  encounter,
  groups,
  places,
  testId,
}: {
  encounter: NpcEncounter
  groups: readonly PlaceGroup[]
  places: EncounterPlaceIndex
  testId: string
}) {
  const text = useEncounterText()

  return (
    <ul className="flex max-h-96 flex-col gap-0.5 overflow-y-auto">
      {groups.map((group) => (
        <DisclosureRow
          key={group.key}
          label={group.label}
          labelClassName={group.labelClassName}
          detail={group.detail}
          defaultOpen={groups.length === 1}
          testId={`${testId}-group-${group.key}`}
        >
          <ul className="flex flex-col gap-0.5 border-l pl-2">
            {group.places.map((place) => (
              <PlaceRow
                key={place.key}
                encounter={encounter}
                place={place}
                places={places}
                label={text.placeLabel(encounter.source, place)}
                testId={`${testId}-place-${place.key}`}
              />
            ))}
          </ul>
        </DisclosureRow>
      ))}
    </ul>
  )
}

function EncounterRow({
  encounter,
  places,
  matching,
  calendar,
  nowMs,
}: {
  encounter: NpcEncounter
  places: EncounterPlaceIndex
  /** The only places to list, while a mission count is set. */
  matching: ReadonlySet<string> | null
  calendar: readonly EventsCalendarStorageModel[] | null
  nowMs: number
}) {
  const { t } = useTranslation("library")
  const text = useEncounterText()
  const [open, setOpen] = useState(false)
  const name = text.groupName(encounter)
  const timing = text.timing(
    encounterTiming(encounter.source, encounter.groupId, calendar, nowMs)
  )
  const href = LINKS[encounter.source]?.(encounter.groupId)
  const testId = `npc-encounter-${encounter.source}-${encounter.groupId}`
  const allPlaces = open ? encounterPlaces(encounter) : []
  const rowPlaces = allPlaces.filter(
    (place) => !matching || matching.has(place.key)
  )
  const onlyPlace = allPlaces.length === 1 ? allPlaces[0] : undefined
  const groups = text.placeGroups(encounter, rowPlaces)

  return (
    <li className="rounded-lg border bg-card text-sm" data-testid={testId}>
      <div className="flex flex-col gap-0.5 px-3 py-2 md:flex-row md:items-baseline md:gap-3">
        {href ? (
          <Link
            to={href}
            className="min-w-0 font-medium break-words underline-offset-4 hover:underline"
            data-testid={`${testId}-link`}
          >
            {name}
          </Link>
        ) : (
          <span className="min-w-0 font-medium break-words">{name}</span>
        )}
        <button
          type="button"
          className="relative flex min-w-0 flex-1 flex-col gap-0.5 pr-6 text-left md:flex-row md:items-baseline md:gap-3"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          data-testid={`${testId}-toggle`}
        >
          <span
            className="min-w-0 break-words text-muted-foreground"
            data-testid={`${testId}-location`}
          >
            {matching
              ? t("npcs.encounters.matches", { count: matching.size })
              : text.location(encounter)}
          </span>
          {timing ? (
            <span
              className="text-xs text-muted-foreground md:ml-auto md:shrink-0"
              data-testid={`${testId}-timing`}
            >
              {timing}
            </span>
          ) : null}
          <Chevron
            open={open}
            className="absolute top-1/2 right-0 -translate-y-1/2"
          />
        </button>
      </div>
      {open ? (
        <div className="border-t px-3 py-2">
          {onlyPlace ? (
            <PlaceNpcs
              encounter={encounter}
              placeKey={onlyPlace.key}
              places={places}
              testId={`${testId}-npcs`}
            />
          ) : groups ? (
            <GroupedPlaces
              encounter={encounter}
              groups={groups}
              places={places}
              testId={testId}
            />
          ) : (
            <ul className="flex max-h-96 flex-col gap-0.5 overflow-y-auto">
              {rowPlaces.map((place) => (
                <PlaceRow
                  key={place.key}
                  encounter={encounter}
                  place={place}
                  places={places}
                  label={text.placeLabel(encounter.source, place)}
                  testId={`${testId}-place-${place.key}`}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  )
}

/**
 * Where the selected variation is fought, grouped by source in the fixed source order. The section always
 * renders (loading / unavailable / none recorded), so the tour step always has its target; on mobile the
 * row's name, location and timing stack. A row opens to its battles, and a battle to every NPC fought there;
 * a group with a single place (a Guild Raid) opens straight to its NPCs. A mission count in the filters
 * narrows the section to the battles that meet it.
 */
export function NpcEncounters({
  encounters,
  encounterPlaces: places,
  matchingPlaces,
  encountersStatus,
  calendar,
}: Pick<
  NpcsPageViewProps,
  | "encounters"
  | "encounterPlaces"
  | "matchingPlaces"
  | "encountersStatus"
  | "calendar"
>) {
  const { t } = useTranslation("library")
  const nowMs = useMinuteNow()

  const note = (testId: string, message: string, hint?: string) => (
    <div
      className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground"
      data-testid={testId}
    >
      <p>{message}</p>
      {hint ? <p className="mt-1 text-xs">{hint}</p> : null}
    </div>
  )

  let body
  if (encountersStatus === "loading") {
    body = note("npc-encounters-loading", t("loading"))
  } else if (encountersStatus !== "present") {
    body = note("npc-encounters-unavailable", t("npcs.encounters.unavailable"))
  } else if (encounters.length === 0) {
    body = note(
      "npc-encounters-none",
      t("npcs.encounters.none"),
      t("npcs.encounters.noneHint")
    )
  } else {
    body = (
      <div className="flex flex-col gap-3">
        {NPC_ENCOUNTER_SOURCES.map((source) => {
          const rows = encounters.filter(
            (e) =>
              e.source === source &&
              (matchingPlaces === null || matchingPlaces(e).size > 0)
          )
          if (rows.length === 0) return null
          return (
            <div
              key={source}
              className="flex flex-col gap-1.5"
              data-testid={`npc-encounters-${source}`}
            >
              <h4 className="text-sm font-semibold">
                {t(`npcs.encounters.source.${source}`)}
              </h4>
              <ul className="flex flex-col gap-1.5">
                {rows.map((encounter) => (
                  <EncounterRow
                    key={encounter.id}
                    encounter={encounter}
                    places={places}
                    matching={matchingPlaces?.(encounter) ?? null}
                    calendar={calendar}
                    nowMs={nowMs}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      data-testid="npc-encounters"
    >
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("npcs.encounters.title")}
      </h3>
      {body}
    </section>
  )
}
