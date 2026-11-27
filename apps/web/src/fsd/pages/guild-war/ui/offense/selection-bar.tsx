import { useId } from "react"
import { useTranslation } from "react-i18next"
import { CircleAlert, FilePen, Skull, Trophy } from "lucide-react"
import { guildWarTokenIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import type { TeamRoster } from "@/entities/team"
import { EntityIcon, FloatingBar } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { LogBlock, Selection } from "../../model/offense"
import { CapChips } from "./cap-chips"
import { StagedTeam } from "./staged-team"

/** The reason Log attack is off, in a player's words. */
function useLogBlockText() {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  return (block: LogBlock) => {
    switch (block.reason) {
      case "deployed":
      case "notOwned": {
        return t(`select.blocked.${block.reason}`, {
          name: unitName(
            block.kind === "mow" ? "Mow" : "Character",
            block.unitId
          ),
        })
      }
      default: {
        return t(`select.blocked.${block.reason}`)
      }
    }
  }
}

/**
 * The contextual bar while units are picked: the picked units, how many, the cap chips (under and
 * over the defenders' cap), why
 * logging is off, a reminder when no Machine of War is picked but one is free (it scrolls to them
 * and never blocks), Clear selection, Log with details, and Lost and Won, which log the attack at
 * once at the page's level, zone and rarity.
 */
export function SelectionBar({
  selection,
  roster,
  cap,
  mowsAvailable,
  onShowMows,
  block,
  pending,
  onClear,
  onLogDetails,
  onQuickLog,
}: {
  selection: Selection
  roster: TeamRoster | null
  cap: Rarity | undefined
  /** Free Machines of War when none is picked; 0 shows no reminder. */
  mowsAvailable: number
  onShowMows: () => void
  block: LogBlock | null
  pending: boolean
  onClear: () => void
  onLogDetails: () => void
  onQuickLog: (result: "won" | "lost") => void
}) {
  const { t } = useTranslation("guildWar")
  const blockText = useLogBlockText()
  const reasonId = useId()
  const isMobile = useIsMobile()
  const off = block !== null || pending
  const describedBy = block ? reasonId : undefined
  return (
    <FloatingBar
      // Above the bottom nav on phones; the nav is not there on desktop.
      className={cn(
        "sticky flex flex-wrap items-center gap-x-3 gap-y-2 p-2 pl-4",
        isMobile
          ? "bottom-[calc(var(--mobile-nav-height)+0.75rem)]"
          : "bottom-3"
      )}
      data-testid="guild-war-selection-bar"
    >
      <StagedTeam cap={cap} roster={roster} selection={selection} />
      <p aria-live="polite" className="text-sm font-medium">
        {t("select.count", { count: selection.size })}
      </p>
      <CapChips cap={cap} roster={roster} selection={selection} />
      {mowsAvailable > 0 ? (
        <Button
          className="border-warning-foreground/60 bg-warning text-warning-foreground hover:bg-warning/80"
          data-testid="guild-war-mow-reminder"
          onClick={onShowMows}
          size="sm"
          variant="outline"
        >
          <CircleAlert data-icon="inline-start" />
          {t("select.noMow", { count: mowsAvailable })}
        </Button>
      ) : null}
      {block ? (
        <p
          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-muted-foreground"
          data-testid="guild-war-log-blocked"
          id={reasonId}
        >
          {block.reason === "noTokens" ? (
            <EntityIcon alt="" size="icon" src={guildWarTokenIcon()} />
          ) : null}
          {blockText(block)}
        </p>
      ) : (
        <span className="flex-1" />
      )}
      <Button onClick={onClear} variant="ghost">
        {t("select.clear")}
      </Button>
      <Button
        aria-describedby={describedBy}
        disabled={off}
        onClick={onLogDetails}
        variant="outline"
      >
        <FilePen data-icon="inline-start" />
        {t("select.logDetails")}
      </Button>
      <Button
        aria-describedby={describedBy}
        disabled={off}
        onClick={() => onQuickLog("lost")}
        variant="destructive"
      >
        <Skull data-icon="inline-start" />
        {t("select.lost")}
      </Button>
      <Button
        aria-describedby={describedBy}
        disabled={off}
        onClick={() => onQuickLog("won")}
      >
        <Trophy data-icon="inline-start" />
        {t("select.won")}
      </Button>
    </FloatingBar>
  )
}
