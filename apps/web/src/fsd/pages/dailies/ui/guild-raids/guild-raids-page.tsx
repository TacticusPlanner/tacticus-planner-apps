import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { GuildAccessBoundary } from "@/features/guild-access"

import { useGuildRaidsTutorial } from "./guild-raids.tutorial"

export function GuildRaidsPage() {
  const { t } = useTranslation("dailies")
  const isMobile = useIsMobile()
  useGuildRaidsTutorial()

  return (
    <div
      className="flex flex-col gap-5 md:gap-7"
      data-testid={
        isMobile ? "guild-raids-mobile-shell" : "guild-raids-desktop-shell"
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">{t("guildRaids.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("guildRaids.subtitle")}
        </p>
      </div>

      <div
        className="w-full md:mx-auto md:max-w-2xl"
        data-testid="guild-raids-access-shell"
      >
        <GuildAccessBoundary showGuildManagementLink>
          {() => (
            <Card data-testid="guild-raids-ready">
              <CardHeader>
                <CardTitle>{t("guildRaids.readyTitle")}</CardTitle>
                <CardDescription>
                  {t("guildRaids.readyDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          )}
        </GuildAccessBoundary>
      </div>
    </div>
  )
}
