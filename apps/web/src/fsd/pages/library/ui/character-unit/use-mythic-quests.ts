import { useTranslation } from "react-i18next"

import type { MythicQuestData } from "../../model/mythic-quests"

/** A character's mythic quests (from the English `mythicQuests` game text), or undefined without any. */
export function useMythicQuests(unitId: string) {
  const { i18n } = useTranslation(["mythicQuests", "mythicQuestTasks"])
  const quests = (i18n.getResource("en", "mythicQuests", unitId) ??
    undefined) as MythicQuestData[] | undefined
  const template = (locaKey: string) =>
    (i18n.getResource(i18n.language, "mythicQuestTasks", locaKey) ??
      i18n.getResource("en", "mythicQuestTasks", locaKey)) as string | undefined
  return { quests: quests && quests.length > 0 ? quests : undefined, template }
}
