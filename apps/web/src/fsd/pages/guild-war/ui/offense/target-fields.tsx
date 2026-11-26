import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  guildWarBuffIcon,
  guildWarZoneIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { EntityIcon, ToolbarField } from "@/shared/ui"

import { zonesByTier } from "../../lib/season"
import type { GuildWarSeason } from "../../lib/season"
import type { ZoneRarity } from "../../model/attack-target"
import { useGuildWarNames } from "../../model/use-guild-war-names"

/** A zone picker's options: zone kinds grouped by their tier at the war's level, each with its
 *  picture and buff. */
export function ZoneOptions({
  season,
  battlefieldLevel,
  container,
}: {
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  /** The dialog or sheet the select opens in (see `useOverlayContainer`). */
  container?: HTMLElement
}) {
  const { zoneName, tierName, buffName } = useGuildWarNames()
  const groups = season ? zonesByTier(season, battlefieldLevel) : []
  return (
    <SelectContent container={container} position="popper">
      {groups.map((group) => (
        <SelectGroup key={group.tierId}>
          <SelectLabel>{tierName(group.tierId)}</SelectLabel>
          {group.zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              <EntityIcon
                alt=""
                className="object-contain"
                size="icon"
                src={guildWarZoneIcon(zone.visualId)}
              />
              {zoneName(season, zone.id)}
              {zone.buffId ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <EntityIcon
                    alt=""
                    size="icon"
                    src={guildWarBuffIcon(zone.buffId)}
                  />
                  {buffName(zone.buffId)}
                </span>
              ) : null}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  )
}

/** A defenders' rarity picker's options: the zone's caps, highest first, each with its icon. */
function RarityOptions({ rarities }: { rarities: readonly ZoneRarity[] }) {
  const { t } = useTranslation("progression")
  return (
    <SelectContent position="popper">
      <SelectGroup>
        {rarities.map((entry) => (
          <SelectItem key={entry.rarity} value={entry.rarity}>
            <EntityIcon alt="" size="icon" src={rarityIcon(entry.rarity)} />
            {t(`rarities.${entry.rarity}`)}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  )
}

/**
 * The Offense toolbar's Find slot: the battlefield level, the zone and the defenders' rarity the page
 * attacks at. The level and zone are picked once per war; the rarity follows from them. They cap the
 * units the page shows and are what Won, Lost and Log with details log at.
 */
export function PageTargetFields({
  season,
  levels,
  level,
  onLevelChange,
  levelDisabled,
  battlefieldLevel,
  zoneId,
  onZoneChange,
  rarities,
  rarity,
  onRarityChange,
}: {
  season: GuildWarSeason | undefined
  /** The levels offered (played levels, and a stored level 0 so it still shows). */
  levels: readonly number[]
  /** The picked level; undefined until one is picked for this war. */
  level: number | undefined
  onLevelChange: (level: number) => void
  levelDisabled: boolean
  /** The war's level, which groups the zones by tier even before a level is picked. */
  battlefieldLevel: number
  zoneId: string | null
  onZoneChange: (zoneId: string) => void
  rarities: readonly ZoneRarity[]
  rarity: Rarity | undefined
  onRarityChange: (rarity: Rarity) => void
}) {
  const { t } = useTranslation("guildWar")
  const levelLabelId = useId()
  const zoneLabelId = useId()
  const rarityLabelId = useId()
  return (
    <>
      <ToolbarField
        label={t("target.level")}
        labelId={levelLabelId}
        testId="guild-war-level-field"
      >
        <Select
          disabled={levelDisabled || levels.length === 0}
          onValueChange={(next) => onLevelChange(Number(next))}
          value={level === undefined ? "" : String(level)}
        >
          <SelectTrigger aria-labelledby={levelLabelId} className="min-w-28">
            <SelectValue placeholder={t("target.levelPlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {levels.map((entry) => (
              <SelectItem key={entry} value={String(entry)}>
                {t("level", { level: entry })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ToolbarField>
      <ToolbarField
        label={t("target.zone")}
        labelId={zoneLabelId}
        testId="guild-war-zone-field"
      >
        <Select
          disabled={!season}
          onValueChange={onZoneChange}
          value={zoneId ?? ""}
        >
          <SelectTrigger aria-labelledby={zoneLabelId} className="min-w-40">
            <SelectValue placeholder={t("target.zonePlaceholder")} />
          </SelectTrigger>
          <ZoneOptions battlefieldLevel={battlefieldLevel} season={season} />
        </Select>
      </ToolbarField>
      <ToolbarField label={t("log.rarity")} labelId={rarityLabelId}>
        <Select
          disabled={rarities.length === 0}
          onValueChange={(next) => {
            const picked = rarities.find((entry) => entry.rarity === next)
            if (picked) onRarityChange(picked.rarity)
          }}
          value={rarity ?? ""}
        >
          <SelectTrigger aria-labelledby={rarityLabelId}>
            <SelectValue placeholder={t("target.rarityPlaceholder")} />
          </SelectTrigger>
          <RarityOptions rarities={rarities} />
        </Select>
      </ToolbarField>
    </>
  )
}
