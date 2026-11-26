import { useTranslation } from "react-i18next"

import type { GuildWarSeason } from "../../lib/season"
import type { GuildWar, GuildWarAttack } from "../../model/types"
import { AttackActions } from "../attack-actions"
import { AttackRow } from "../attack-row"

/** The current war's attacks, newest first, each with Edit and Delete (Delete asks first). Every
 *  Delete waits while one is in flight, so two never race. */
export function AttackLog({
  war,
  season,
  deleting,
  onEdit,
  onDelete,
}: {
  war: GuildWar
  season: GuildWarSeason | undefined
  deleting: boolean
  onEdit: (attack: GuildWarAttack) => void
  onDelete: (attack: GuildWarAttack) => void
}) {
  const { t, i18n } = useTranslation("guildWar")
  return (
    <section
      aria-labelledby="guild-war-log-heading"
      className="flex scroll-mt-4 flex-col gap-2"
      id="guild-war-attack-log"
      data-testid="guild-war-attack-log"
    >
      <h2 className="text-sm font-medium" id="guild-war-log-heading">
        {t("attackLog.heading")}
      </h2>
      <ol className="flex flex-col gap-2">
        {war.attacks.toReversed().map((attack) => (
          <AttackRow
            actions={
              <AttackActions
                deleting={deleting}
                onDelete={() => onDelete(attack)}
                onEdit={() => onEdit(attack)}
              />
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
