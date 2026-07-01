import { useTranslation } from "react-i18next"

/** "Coming soon" placeholder for the Lookup tabs that don't have real content yet. */
export function LookupPlaceholder({ tab }: { tab: "mow" | "npc" }) {
  const { t } = useTranslation()

  return (
    <p className="py-10 text-center text-muted-foreground">
      {t(`unitLookup.tabs.${tab}ComingSoon`)}
    </p>
  )
}
