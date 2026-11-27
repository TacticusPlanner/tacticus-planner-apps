import { useId } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router"
import type { To } from "react-router"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import {
  characterIcon,
  factionIcon,
  mowBadgeIcon,
  mowIcon,
  progressionVisual,
  rankIcon,
  shardIcon,
} from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import { itemLibraryPath } from "@/shared/equipment"
import { CompactStars, EntityIcon, TruncatedText } from "@/shared/ui"

import type {
  OwnedUnitTileData,
  UnitFaction,
  UnitKind,
  UnitTileEquipment,
  UnitTileUnit,
  UnownedUnitTileData,
} from "../model/types"
import { EquipmentSlot, UnownedDetails } from "./unit-parts"
import { rarityColor } from "./unit-styles"
import { usesMythicShards, useUnitTileLabel } from "./unit-tile-label"

// Fixed columns so every row of a list lines up: portrait, name (the only flexible column), rank,
// stars, XP level, the two ability levels, then three equipment squares.
const linkColumns =
  "grid-cols-[1.75rem_minmax(0,1fr)_1.625rem_3rem_2.75rem_2rem_2rem_4.375rem]"
// Mobile keeps the columns that fit 420px; the rest move into the expanded panel.
const expandableColumns =
  "grid-cols-[1.75rem_minmax(0,1fr)_1.625rem_3rem_2.75rem_1rem]"
// The same with a leading faction icon column, for a list not grouped by faction.
const linkColumnsWithFaction =
  "grid-cols-[1.25rem_1.75rem_minmax(0,1fr)_1.625rem_3rem_2.75rem_2rem_2rem_4.375rem]"
const expandableColumnsWithFaction =
  "grid-cols-[1.25rem_1.75rem_minmax(0,1fr)_1.625rem_3rem_2.75rem_1rem]"
const cellBox =
  "grid h-5 place-items-center rounded border text-xs font-semibold tabular-nums"

type RosterRowLink = { to: To; state?: unknown }

/**
 * One unit of the player's collection as a dense row: the Roster view's counterpart of `UnitTile`,
 * from the same data and with the same spelled-out accessible name. `form="link"` (desktop) makes
 * the whole 44px row the link. `form="expandable"` (mobile) is a 48px button showing what fits;
 * activating it expands a panel with the ability levels, equipment and shards (or the unlock
 * progress) and a link to the unit page. The parent owns which row is expanded. Presentational only.
 */
export function UnitRosterRow({
  unit,
  link,
  faction,
  form = "link",
  expanded = false,
  onToggle,
  className,
  testId,
}: {
  unit: UnitTileUnit
  /** Where the row (or the expanded panel's link) leads; `state` goes into history, never the URL. */
  link?: RosterRowLink
  /** Shows the faction (icon, and name in the accessible name) when no faction section does. */
  faction?: UnitFaction
  form?: "link" | "expandable"
  /** `form="expandable"` only. */
  expanded?: boolean
  onToggle?: () => void
  className?: string
  testId?: string
}) {
  const label = useUnitTileLabel(unit, faction)
  const panelId = useId()
  const owned = unit.data.state === "owned" ? unit.data : undefined
  const rootData = { "data-testid": testId, "data-state": unit.data.state }

  if (form === "expandable") {
    return (
      <div {...rootData} className={cn("min-w-0", className)}>
        <Pressable
          aria-label={label}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className={cn(
            "grid h-12 w-full items-center gap-x-1.5 rounded-md px-2 text-left",
            faction ? expandableColumnsWithFaction : expandableColumns
          )}
        >
          {faction ? <FactionCell faction={faction} /> : null}
          <Portrait unit={unit} />
          <Name unit={unit} />
          {owned ? (
            <>
              <RankCell kind={unit.kind} data={owned} />
              <StarsCell data={owned} />
              <LevelCell kind={unit.kind} data={owned} />
            </>
          ) : (
            <span className="col-span-3" />
          )}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-icon-sm text-muted-foreground transition-transform motion-reduce:transition-none",
              expanded && "rotate-180"
            )}
          />
        </Pressable>
        <div
          id={panelId}
          hidden={!expanded}
          className="px-2 pt-1 pb-3"
          data-testid="unit-row-panel"
        >
          {expanded ? (
            <ExpandedPanel unit={unit} owned={owned} link={link} />
          ) : null}
        </div>
      </div>
    )
  }

  const content = (
    <>
      {faction ? <FactionCell faction={faction} /> : null}
      <Portrait unit={unit} />
      <Name unit={unit} />
      {owned ? (
        <>
          <RankCell kind={unit.kind} data={owned} />
          <StarsCell data={owned} />
          <LevelCell kind={unit.kind} data={owned} />
          <span className={cellBox}>{owned.abilityLevels[0]}</span>
          <span className={cellBox}>{owned.abilityLevels[1]}</span>
          {unit.kind === "character" ? (
            <EquipmentCells equipment={owned.equipment} />
          ) : (
            <span />
          )}
        </>
      ) : (
        // Unowned: what the Cards tile shows below its name, spanning the stat columns.
        <div className="col-span-6 min-w-0">
          <UnownedDetails data={unit.data as UnownedUnitTileData} />
        </div>
      )}
    </>
  )
  const layout = cn(
    "grid h-11 min-w-0 items-center gap-x-1.5 px-2",
    faction ? linkColumnsWithFaction : linkColumns,
    className
  )

  return link ? (
    <Link
      to={link.to}
      state={link.state}
      aria-label={label}
      {...rootData}
      className={cn(layout, "rounded-md interactive-surface")}
    >
      {content}
    </Link>
  ) : (
    <div role="group" aria-label={label} {...rootData} className={layout}>
      {content}
    </div>
  )
}

function FactionCell({ faction }: { faction: UnitFaction }) {
  return (
    <span
      className="block size-5"
      data-testid="unit-row-faction"
      data-faction={faction.id}
    >
      <EntityIcon src={factionIcon(faction.id)} alt="" className="size-full" />
    </span>
  )
}

function Portrait({ unit }: { unit: UnitTileUnit }) {
  const owned = unit.data.state === "owned" ? unit.data : undefined
  return (
    <span
      className={cn(
        "block size-icon-lg overflow-hidden rounded-full bg-portrait",
        owned
          ? "border-2"
          : "border-2 border-dashed border-border opacity-60 grayscale"
      )}
      style={
        owned
          ? { borderColor: rarityColor(progressionRarity(owned.progression)) }
          : undefined
      }
      data-testid="unit-row-portrait"
      data-rarity={owned ? progressionRarity(owned.progression) : undefined}
    >
      <EntityIcon
        src={
          unit.kind === "character"
            ? characterIcon(unit.unitId)
            : mowIcon(unit.unitId)
        }
        alt=""
        className="size-full object-cover"
      />
    </span>
  )
}

function Name({ unit }: { unit: UnitTileUnit }) {
  return (
    <TruncatedText
      className={cn(
        "min-w-0 text-sm font-semibold",
        unit.data.state !== "owned" && "text-muted-foreground"
      )}
      data-testid="unit-row-name"
    >
      {unit.name}
    </TruncatedText>
  )
}

function RankCell({ kind, data }: { kind: UnitKind; data: OwnedUnitTileData }) {
  if (kind === "mow") {
    // No rank: the game's MoW badge marks it apart from the characters around it.
    return (
      <span className="block size-icon-md" data-testid="unit-row-mow-badge">
        <EntityIcon src={mowBadgeIcon()} alt="" className="size-full" />
      </span>
    )
  }
  return data.rank ? (
    <span className="block size-icon-md" data-testid="unit-row-rank">
      <EntityIcon src={rankIcon(data.rank)} alt="" className="size-full" />
    </span>
  ) : (
    <span />
  )
}

function StarsCell({ data }: { data: OwnedUnitTileData }) {
  return progressionVisual(data.progression).kind === "none" ? (
    <span />
  ) : (
    <CompactStars data-testid="unit-row-stars" progression={data.progression} />
  )
}

function LevelCell({
  kind,
  data,
}: {
  kind: UnitKind
  data: OwnedUnitTileData
}) {
  const { t } = useTranslation("common")
  return kind === "character" && data.xpLevel !== undefined ? (
    <span
      className="text-xs font-bold tabular-nums"
      data-testid="unit-row-level"
    >
      {t("unitRow.level", { level: data.xpLevel })}
    </span>
  ) : (
    <span />
  )
}

function EquipmentCells({
  equipment,
  linked = false,
}: {
  equipment: UnitTileEquipment[] | undefined
  /** Each item links to its Library page (only where the row itself isn't a link). */
  linked?: boolean
}) {
  return (
    <span className="grid grid-cols-3 gap-0.5" data-testid="unit-row-equipment">
      {[0, 1, 2].map((index) => {
        const item = equipment?.[index]
        return item ? (
          linked ? (
            <ItemLink item={item} key={index} />
          ) : (
            <EquipmentSlot key={index} item={item} />
          )
        ) : (
          <span
            key={index}
            className="h-6 rounded-sm border-2 border-dashed"
            data-testid="unit-tile-empty-slot"
          />
        )
      })}
    </span>
  )
}

/** An equipped item that opens its Library page. */
function ItemLink({ item }: { item: UnitTileEquipment }) {
  const { t } = useTranslation(["equipmentItems", "library"])
  return (
    <Link
      aria-label={`${t(`equipmentItems:${item.equipmentId}`, { defaultValue: item.equipmentId })}: ${t("library:items.openInLibrary")}`}
      className="grid rounded-sm hover:brightness-110"
      to={itemLibraryPath(item.equipmentId)}
    >
      <EquipmentSlot item={item} />
    </Link>
  )
}

function ExpandedPanel({
  unit,
  owned,
  link,
}: {
  unit: UnitTileUnit
  owned: OwnedUnitTileData | undefined
  link: RosterRowLink | undefined
}) {
  const { t } = useTranslation("common")
  const character = unit.kind === "character"

  return (
    <div className="flex flex-col gap-3">
      {owned ? (
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-xs">
          <PanelEntry
            term={t(character ? "unitRow.active" : "unitRow.primary")}
          >
            <span className={cn(cellBox, "w-8")}>{owned.abilityLevels[0]}</span>
          </PanelEntry>
          <PanelEntry
            term={t(character ? "unitRow.passive" : "unitRow.secondary")}
          >
            <span className={cn(cellBox, "w-8")}>{owned.abilityLevels[1]}</span>
          </PanelEntry>
          {character ? (
            <PanelEntry term={t("unitRow.equipment")}>
              <span className="block w-17.5">
                <EquipmentCells equipment={owned.equipment} linked />
              </span>
            </PanelEntry>
          ) : null}
          <PanelEntry term={t("unitRow.shards")}>
            <span
              className="flex items-center gap-1 font-semibold tabular-nums"
              data-testid={
                usesMythicShards(owned.progression)
                  ? "unit-row-mythic-shards"
                  : "unit-row-shards"
              }
            >
              <EntityIcon
                size="icon"
                src={shardIcon(
                  usesMythicShards(owned.progression) ? "Mythic" : "Regular"
                )}
                alt=""
              />
              {usesMythicShards(owned.progression)
                ? owned.mythicShards
                : owned.shards}
            </span>
          </PanelEntry>
        </dl>
      ) : (
        <UnownedDetails data={unit.data as UnownedUnitTileData} />
      )}
      {link ? (
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to={link.to} state={link.state}>
            {t("unitRow.open", { name: unit.name })}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

function PanelEntry({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </>
  )
}
