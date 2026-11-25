import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Swords } from "lucide-react"
import { guildWarTokenIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon, FloatingBar } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { LogBlock } from "../../model/offense"

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

/** The contextual bar while units are picked: how many, why Log attack is off, Clear and Log
 *  attack. */
export function SelectionBar({
  count,
  block,
  onClear,
  onLog,
}: {
  count: number
  block: LogBlock | null
  onClear: () => void
  onLog: () => void
}) {
  const { t } = useTranslation("guildWar")
  const blockText = useLogBlockText()
  const reasonId = useId()
  return (
    <FloatingBar
      className="sticky bottom-[calc(var(--mobile-nav-height,0px)+0.75rem)] flex flex-wrap items-center gap-x-3 gap-y-2 p-2 pl-4"
      data-testid="guild-war-selection-bar"
    >
      <p aria-live="polite" className="text-sm font-medium">
        {t("select.count", { count })}
      </p>
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
        aria-describedby={block ? reasonId : undefined}
        disabled={block !== null}
        onClick={onLog}
      >
        <Swords data-icon="inline-start" />
        {t("select.log")}
      </Button>
    </FloatingBar>
  )
}
