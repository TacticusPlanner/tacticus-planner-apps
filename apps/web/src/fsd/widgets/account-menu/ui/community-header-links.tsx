import { Coffee } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { BUY_ME_A_COFFEE_URL, DISCORD_INVITE_URL } from "@/shared/config"

import { DiscordIcon } from "./discord-icon"

/** Discord and Buy Me a Coffee icon links for the desktop top bar, beside the account menu. */
export function CommunityHeaderLinks() {
  const { t } = useTranslation()

  return (
    <>
      <Button asChild size="icon" variant="ghost">
        <a
          aria-label={t("community.discordLabel")}
          data-testid="header-discord"
          href={DISCORD_INVITE_URL}
          rel="noopener noreferrer"
          target="_blank"
          title={t("community.discordLabel")}
        >
          <DiscordIcon className="size-4" />
        </a>
      </Button>
      <Button asChild size="icon" variant="ghost">
        <a
          aria-label={t("community.buyMeACoffeeLabel")}
          data-testid="header-buy-me-a-coffee"
          href={BUY_ME_A_COFFEE_URL}
          rel="noopener noreferrer"
          target="_blank"
          title={t("community.buyMeACoffeeLabel")}
        >
          <Coffee />
        </a>
      </Button>
    </>
  )
}
