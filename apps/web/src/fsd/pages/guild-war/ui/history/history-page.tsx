import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/ui"

import { useGuildWarTutorial } from "../guild-war.tutorial"

/** Guild War History: the player's ended wars, newest first. */
export function HistoryPage() {
  const { t } = useTranslation("guildWar")
  useGuildWarTutorial("history")
  return (
    <div className="flex flex-col gap-5" data-testid="guild-war-history">
      <EmptyState
        description={t("history.emptyDescription")}
        testId="guild-war-history-empty"
        title={t("history.empty")}
        variant="empty"
      />
    </div>
  )
}
