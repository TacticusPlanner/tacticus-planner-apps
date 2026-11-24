import { Coffee } from "lucide-react"
import { useTranslation } from "react-i18next"
import { IconButton } from "@workspace/ui/components/icon-button"

import { BUY_ME_A_COFFEE_URL, DISCORD_INVITE_URL } from "@/shared/config"

import { DiscordIcon } from "./discord-icon"

/** Discord and Buy Me a Coffee icon links for the desktop top bar, beside the account menu. */
export function CommunityHeaderLinks() {
  const { t } = useTranslation()

  return (
    <>
      <IconButton
        asChild
        className="size-10"
        label={t("community.discordLabel")}
      >
        <a
          data-testid="header-discord"
          href={DISCORD_INVITE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <DiscordIcon className="size-icon" />
        </a>
      </IconButton>
      <IconButton
        asChild
        className="size-10"
        label={t("community.buyMeACoffeeLabel")}
      >
        <a
          data-testid="header-buy-me-a-coffee"
          href={BUY_ME_A_COFFEE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Coffee />
        </a>
      </IconButton>
    </>
  )
}
