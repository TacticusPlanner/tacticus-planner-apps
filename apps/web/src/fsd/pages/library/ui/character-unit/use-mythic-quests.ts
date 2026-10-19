import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import { getMythicQuestsByUnitId } from "@workspace/game-catalog/queries"

/**
 * A character's mythic quests from the catalog's `mythic-quests` dataset, or undefined without any
 * (no record for the character, the dataset not synced into this client, or still reading). Task
 * templates come from the English `mythicQuestTasks` game text, in the UI language when it has one.
 */
export function useMythicQuests(unitId: string) {
  const { i18n } = useTranslation("mythicQuestTasks")
  const record = useLiveQuery(
    async () => (await getMythicQuestsByUnitId()).get(unitId),
    [unitId]
  )
  const quests = record?.quests
  const template = (locaKey: string) =>
    (i18n.getResource(i18n.language, "mythicQuestTasks", locaKey) ??
      i18n.getResource("en", "mythicQuestTasks", locaKey)) as string | undefined
  return { quests: quests && quests.length > 0 ? quests : undefined, template }
}
