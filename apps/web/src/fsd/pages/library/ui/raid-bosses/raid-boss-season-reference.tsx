import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { rarityIcon } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { RaidBossPortrait } from "@/entities/raid-boss"
import { EntityIcon } from "@/shared/ui"
import type { ResolvedRaidBossEncounterLocation } from "@/entities/raid-boss"

import type { RaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"

export function RaidBossSeasonReference({
  viewModel,
  seasonIds,
  onSeasonChange,
  onEncounterSelect,
}: {
  viewModel: RaidBossSeasonReferenceViewModel
  seasonIds: string[]
  onSeasonChange: (seasonId: string) => void
  onEncounterSelect: (location: ResolvedRaidBossEncounterLocation) => void
}) {
  const { t } = useTranslation(["library", "progression"])

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="raid-boss-season-reference"
    >
      <label
        className="flex flex-wrap items-center gap-3 text-sm"
        data-testid="raid-boss-season-selector"
      >
        <span className="text-muted-foreground">{t("raidBosses.season")}</span>
        <Select value={viewModel.seasonId} onValueChange={onSeasonChange}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {seasonIds.map((id, index) => (
              <SelectItem key={id} value={id}>
                {t("raidBosses.seasonLabel", { season: index + 1 })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {viewModel.tiers.map((tier) => (
        <section
          key={tier.tier}
          className="flex flex-col gap-4 rounded-lg border p-4"
          data-testid={`raid-boss-season-tier-${tier.tier}`}
        >
          <h2 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold">
            {tier.rarity ? (
              <span className="inline-flex items-center gap-2 self-center">
                <EntityIcon
                  size="inline"
                  src={rarityIcon(tier.rarity)}
                  alt=""
                />
                {t(`progression:rarities.${tier.rarity}`, {
                  defaultValue: tier.rarity,
                })}
              </span>
            ) : null}{" "}
            <span
              className={
                tier.rarity
                  ? "text-sm font-normal text-muted-foreground"
                  : undefined
              }
            >
              {t("raidBosses.tier", { tier: tier.tier })}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {tier.sets.map((set) => (
              <div
                key={set.set}
                className="flex flex-col gap-2"
                data-testid={`raid-boss-season-set-${set.set}`}
              >
                <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                  {set.bossName ? <span>{set.bossName}</span> : null}{" "}
                  <span className="font-normal text-muted-foreground">
                    {t("raidBosses.set", { set: set.setNumber })}
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
                  {set.encounters.map((located, index) => (
                    <Fragment key={located.encounterIndex}>
                      {/* Sets the boss apart from its primes, on the one-row desktop layout. */}
                      {index === 1 && set.bossName ? (
                        <div
                          aria-hidden="true"
                          className="w-px self-stretch bg-border max-lg:hidden"
                        />
                      ) : null}
                      <SeasonTile
                        located={located}
                        onSelect={onEncounterSelect}
                      />
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** One encounter of a set: portrait, name, and a Boss (and Primarch) or Prime badge. */
function SeasonTile({
  located,
  onSelect,
}: {
  located: RaidBossSeasonReferenceViewModel["tiers"][number]["sets"][number]["encounters"][number]
  onSelect: (location: ResolvedRaidBossEncounterLocation) => void
}) {
  const { t } = useTranslation("library")
  const isBoss = located.item.kind === "boss"
  return (
    <button
      type="button"
      aria-label={located.item.name}
      onClick={() => onSelect(located)}
      className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border interactive-surface p-2 text-center lg:w-32"
      data-testid={`raid-boss-season-tile-${located.encounterIndex}`}
    >
      <RaidBossPortrait
        name={located.item.name}
        src={located.item.portraitSrc}
        size="portrait-md"
      />
      <span className="line-clamp-2 text-xs font-medium">
        {located.item.name}
      </span>
      <span className="flex flex-wrap justify-center gap-1">
        <Badge variant={isBoss ? "default" : "secondary"}>
          {t(isBoss ? "raidBosses.bossBadge" : "raidBosses.primeBadge")}
        </Badge>
        {located.item.isPrimarch ? (
          <Badge variant="outline">{t("raidBosses.primarch")}</Badge>
        ) : null}
      </span>
    </button>
  )
}
