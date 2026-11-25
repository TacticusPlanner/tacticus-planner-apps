import { useId } from "react"
import { useTranslation } from "react-i18next"
import { rarityIcon } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  GUILD_WAR_SLOTS,
  tierRarityCaps,
  zoneTierId,
  zonesByTier,
} from "../lib/season"
import type { AttackTarget } from "../model/attack-target"
import type { GuildWarSeason } from "../lib/season"
import { EntityIcon, ToolbarField } from "@/shared/ui"

import { useGuildWarNames } from "../model/use-guild-war-names"

/**
 * The zone and slot being attacked, above the tabs (they scope both): a Zone select grouped by the
 * zones' tier at the war's level, each zone with its buff, and a Slot select showing each slot's
 * rarity cap for the picked zone.
 */
export function AttackTargetBar({
  season,
  battlefieldLevel,
  target,
  onZoneChange,
  onSlotChange,
}: {
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  target: AttackTarget
  onZoneChange: (zoneId: string) => void
  onSlotChange: (slot: number) => void
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { zoneName, tierName, buffName } = useGuildWarNames()
  const zoneLabelId = useId()
  const slotLabelId = useId()
  const groups = season ? zonesByTier(season, battlefieldLevel) : []
  const caps = season
    ? tierRarityCaps(
        season,
        target.zoneId === null
          ? undefined
          : zoneTierId(season, battlefieldLevel, target.zoneId)
      )
    : []

  return (
    <div
      aria-label={t("target.label")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      data-testid="guild-war-target"
      role="group"
    >
      <ToolbarField label={t("target.zone")} labelId={zoneLabelId}>
        <Select
          disabled={!season}
          onValueChange={onZoneChange}
          value={target.zoneId ?? ""}
        >
          <SelectTrigger
            aria-labelledby={zoneLabelId}
            className="min-w-48"
            data-testid="guild-war-zone"
          >
            <SelectValue placeholder={t("target.zonePlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {groups.map((group) => (
              <SelectGroup key={group.tierId}>
                <SelectLabel>{tierName(group.tierId)}</SelectLabel>
                {group.zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zoneName(season, zone.id)}
                    {zone.buffId ? (
                      <span className="text-xs text-muted-foreground">
                        {buffName(zone.buffId)}
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </ToolbarField>
      <ToolbarField label={t("target.slot")} labelId={slotLabelId}>
        <Select
          disabled={!season}
          onValueChange={(next) => onSlotChange(Number(next))}
          value={target.slot === null ? "" : String(target.slot)}
        >
          <SelectTrigger
            aria-labelledby={slotLabelId}
            className="min-w-36"
            data-testid="guild-war-slot"
          >
            <SelectValue placeholder={t("target.slotPlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {GUILD_WAR_SLOTS.map((slot) => {
              const cap = caps[slot]
              return (
                <SelectItem key={slot} value={String(slot)}>
                  {cap ? (
                    <EntityIcon
                      alt={t(`progression:rarities.${cap}`)}
                      size="icon"
                      src={rarityIcon(cap)}
                    />
                  ) : null}
                  {t("target.slotOption", { slot: slot + 1 })}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </ToolbarField>
    </div>
  )
}
