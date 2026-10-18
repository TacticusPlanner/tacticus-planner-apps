import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useMsal } from "@azure/msal-react"
import { factionIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { loginRequest } from "@/shared/auth"
import { EntityIcon } from "@/shared/ui"

import type { UnitOwnership } from "./unit-ownership"
import { UnitPortrait } from "./unit-portrait"

export type ValuesMode = "base" | "custom"

/**
 * The unit header shared by character and Machine of War pages: portrait, name, faction and kind
 * line, a line describing the values shown (the player's unit, its starting values, or why the page
 * can't use the player's), the unit's power at those values, and the "Show values at" control, whose
 * Custom selects come from the caller. In header state (c) a banner offers to sign in; signed in but not yet synced, it points at
 * the app header's Sync with Tacticus control.
 */
export function UnitHeader({
  portraitSrc,
  portraitRarity,
  name,
  factionId,
  kindLine,
  ownership,
  signedIn,
  yourUnit,
  notUnlockedText,
  showingText,
  shards,
  mode,
  onModeChange,
  customControls,
  power,
  isMobile,
}: {
  portraitSrc: string
  portraitRarity: Rarity
  name: string
  factionId: string
  /** Shown after the faction chip, e.g. the alliance, or "<alliance> · Machine of War". */
  kindLine: string
  ownership: UnitOwnership
  signedIn: boolean
  /** "Your unit:" label and its details, for an owned unit. */
  yourUnit?: { label: string; line: string }
  /** Header state (b): what the values start at. */
  notUnlockedText: string
  /** Header state (c): what the values are. */
  showingText: string
  /** Shard progress towards unlocking, for a unit the player doesn't own. */
  shards?: { owned: number; needed: number }
  mode: ValuesMode
  onModeChange: (mode: ValuesMode) => void
  /** The selects Custom reveals (rarity and stars, plus rank for characters). */
  customControls: ReactNode
  /** The unit's power at the shown values (`UnitPowerValue`), first in the values area. */
  power?: ReactNode
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "factions"])
  const { instance } = useMsal()
  const baseLabel =
    ownership === "owned"
      ? t("unit.values.yourUnit")
      : t("unit.values.starting")

  return (
    <div className="flex flex-col gap-3" data-testid="unit-header">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <UnitPortrait
          src={portraitSrc}
          rarity={portraitRarity}
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
            {kindLine}
          </p>
          {ownership === "owned" && yourUnit ? (
            <p
              className={isMobile ? "text-[13px]" : "text-sm"}
              data-testid="unit-your-line"
            >
              <span className="font-semibold">{yourUnit.label}</span>{" "}
              {yourUnit.line}
            </p>
          ) : null}
          {ownership === "notOwned" ? (
            <p className="text-sm" data-testid="unit-not-unlocked">
              {notUnlockedText}
            </p>
          ) : null}
          {ownership === "noRoster" ? (
            <p className="text-sm" data-testid="unit-showing-starting">
              {showingText}
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
          {power}
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
          {mode === "custom" ? customControls : null}
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
