import { useTranslation } from "react-i18next"
import { Undo2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import type { GuildWarSeason } from "../../lib/season"
import type { GuildWar, GuildWarAttack } from "../../model/types"
import { AttackRow } from "../attack-row"

/** The current war's attacks, newest first, each with Undo (no confirm: logging it again undoes
 *  the Undo). */
export function AttackLog({
  war,
  season,
  undoingId,
  onUndo,
}: {
  war: GuildWar
  season: GuildWarSeason | undefined
  undoingId: string | null
  onUndo: (attack: GuildWarAttack) => void
}) {
  const { t, i18n } = useTranslation("guildWar")
  return (
    <section
      aria-labelledby="guild-war-log-heading"
      className="flex flex-col gap-2"
      data-testid="guild-war-attack-log"
    >
      <h2 className="text-sm font-medium" id="guild-war-log-heading">
        {t("attackLog.heading")}
      </h2>
      <ol className="flex flex-col gap-2">
        {war.attacks.toReversed().map((attack) => (
          <AttackRow
            actions={
              <Button
                data-testid="guild-war-undo"
                disabled={undoingId === attack.id}
                onClick={() => onUndo(attack)}
                size="sm"
                variant="ghost"
              >
                <Undo2 data-icon="inline-start" />
                {t("attackLog.undo")}
              </Button>
            }
            attack={attack}
            key={attack.id}
            locale={i18n.language}
            season={season}
          />
        ))}
      </ol>
    </section>
  )
}
