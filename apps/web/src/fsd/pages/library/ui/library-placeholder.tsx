import { useTranslation } from "react-i18next"

/** Placeholder for Library collections that do not have a detail view yet. */
export function LookupPlaceholder({
  tab,
}: {
  tab: "mow" | "npc" | "raidBoss"
}) {
  const { t } = useTranslation()

  return (
    <p className="py-10 text-center text-muted-foreground">
      {t(`unitLookup.tabs.${tab}ComingSoon`)}
    </p>
  )
}
