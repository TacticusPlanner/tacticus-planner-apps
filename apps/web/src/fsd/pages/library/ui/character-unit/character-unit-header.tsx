import { useTranslation } from "react-i18next"
import { useMsal } from "@azure/msal-react"
import { characterIcon, factionIcon } from "@workspace/game-catalog"
import {
  lastRank,
  maxRankForProgression,
  progressionOrder,
  progressionRarity,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { loginRequest } from "@/shared/auth"
import { EntityIcon, ProgressionSelect, RankSelect } from "@/shared/ui"

import { UnitPortrait } from "../unit/unit-portrait"
import type { ShownValues, UnitOwnership } from "./character-unit.view-model"

export type ValuesMode = "base" | "custom"

/**
 * The unit header: portrait, name, faction and alliance, a line describing the values shown (the
 * player's unit, its starting values, or why the page can't use the player's), and the "Show values
 * at" control. In header state (c) a banner offers to sign in; signed in but not yet synced, it
 * points at the app header's Sync with Tacticus control.
 */
export function CharacterUnitHeader({
  unitId,
  name,
  factionId,
  alliance,
  ownership,
  signedIn,
  baseValues,
  shown,
  mode,
  onModeChange,
  onCustomChange,
  yourUnitLine,
  shards,
  isMobile,
}: {
  unitId: UnitId
  name: string
  factionId: string
  alliance: string
  ownership: UnitOwnership
  signedIn: boolean
  /** The player's values (owned) or the starting values (otherwise). */
  baseValues: ShownValues
  shown: ShownValues
  mode: ValuesMode
  onModeChange: (mode: ValuesMode) => void
  onCustomChange: (values: ShownValues) => void
  /** "Your unit: …" details, for an owned unit. */
  yourUnitLine?: string
  /** Shard progress towards unlocking, for a unit the player doesn't own. */
  shards?: { owned: number; needed: number }
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "factions", "progression"])
  const { instance } = useMsal()
  const rarity = progressionRarity(shown.progression)
  const baseRarity = progressionRarity(baseValues.progression)
  const stars = (value: Progression) =>
    t(`progression:stars.${value.slice(value.indexOf(":") + 1)}`, {
      defaultValue: value,
    })
  const describe = (values: ShownValues) => ({
    rarity: t(`progression:rarities.${progressionRarity(values.progression)}`, {
      defaultValue: progressionRarity(values.progression),
    }),
    stars: stars(values.progression),
    rank: t(`progression:ranks.${values.rank}`, { defaultValue: values.rank }),
  })
  const baseLabel =
    ownership === "owned"
      ? t("unit.values.yourUnit")
      : t("unit.values.starting")
  const rankOptions = rankOrder.filter(
    (rank) =>
      rankIndex(rank) <= rankIndex(lastRank) &&
      rankIndex(rank) <= rankIndex(maxRankForProgression(shown.progression))
  )
  const setProgression = (progression: Progression) => {
    const maxRank = maxRankForProgression(progression)
    onCustomChange({
      progression,
      rank: rankIndex(shown.rank) > rankIndex(maxRank) ? maxRank : shown.rank,
    })
  }

  return (
    <div className="flex flex-col gap-3" data-testid="unit-header">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <UnitPortrait
          src={characterIcon(unitId) ?? ""}
          rarity={ownership === "notOwned" ? baseRarity : rarity}
          greyed={ownership === "notOwned"}
          size={isMobile ? 84 : 112}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1
            className={cn(
              "font-heading leading-tight font-bold",
              isMobile ? "text-[26px]" : "text-[34px]"
            )}
          >
            {name}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-xs font-bold tracking-[.06em] text-foreground uppercase">
              <EntityIcon
                src={factionIcon(factionId)}
                alt=""
                className="size-4"
              />
              {t(`factions:${factionId}`, { defaultValue: factionId })}
            </span>
            {alliance}
          </p>
          {ownership === "owned" && yourUnitLine ? (
            <p
              className={isMobile ? "text-[13px]" : "text-sm"}
              data-testid="unit-your-line"
            >
              <span className="font-semibold">
                {t("characterUnit.header.yourUnit")}
              </span>{" "}
              {yourUnitLine}
            </p>
          ) : null}
          {ownership === "notOwned" ? (
            <p className="text-sm" data-testid="unit-not-unlocked">
              {t("characterUnit.header.notUnlocked", describe(baseValues))}
            </p>
          ) : null}
          {ownership === "noRoster" ? (
            <p className="text-sm" data-testid="unit-showing-starting">
              {t("characterUnit.header.showing", describe(baseValues))}
            </p>
          ) : null}
          {ownership === "notOwned" && shards ? (
            <div className="flex max-w-xs items-center gap-2 text-xs">
              <div
                role="progressbar"
                aria-label={t("characterUnit.header.shardProgress")}
                aria-valuemin={0}
                aria-valuemax={shards.needed}
                aria-valuenow={Math.min(shards.owned, shards.needed)}
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                data-testid="unit-shard-progress"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (shards.owned / Math.max(shards.needed, 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="tabular-nums">
                {t("characterUnit.header.shards", shards)}
              </span>
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex flex-wrap items-end gap-3",
            isMobile ? "w-full" : "ml-auto self-start"
          )}
          data-testid="unit-values"
        >
          <ToggleGroup
            aria-label={t("unit.values.label")}
            type="single"
            variant="outline"
            spacing={0}
            value={mode}
            onValueChange={(value) => {
              // Radix emits "" when the pressed item is clicked again; keep one selected.
              if (value) onModeChange(value as ValuesMode)
            }}
          >
            {(["base", "custom"] as const).map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                size="sm"
                className={cn("px-3", isMobile && "h-[38px]")}
                data-testid={`unit-values-${option}`}
              >
                {option === "base" ? baseLabel : t("unit.values.custom")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {mode === "custom" ? (
            <>
              <div className="w-56">
                <ProgressionSelect
                  label={t("unit.values.stars")}
                  value={shown.progression}
                  options={progressionOrder}
                  onChange={setProgression}
                />
              </div>
              <div className="w-40">
                <RankSelect
                  label={t("unit.values.rank")}
                  value={shown.rank}
                  options={rankOptions}
                  onChange={(rank: Rank) => onCustomChange({ ...shown, rank })}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {ownership === "noRoster" ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border border-ring bg-muted/50 px-4 py-3 text-sm"
          role="status"
          data-testid="unit-sign-in-banner"
        >
          <p className="flex-1">
            {signedIn
              ? t("characterUnit.header.syncBanner")
              : t("characterUnit.header.signInBanner")}
          </p>
          {signedIn ? null : (
            <Button
              size="sm"
              onClick={() => void instance.loginRedirect(loginRequest)}
            >
              {t("characterUnit.header.signIn")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
