import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { USERJOT_BOARD_URL } from "./userjot-provider"

type UserJotBoardLinkProps = {
  className?: string
  onClick?: () => void
  showLabel?: boolean
}

export function UserJotBoardLink({
  className,
  onClick,
  showLabel = false,
}: UserJotBoardLinkProps) {
  const { t } = useTranslation()

  return (
    <Button
      asChild
      className={cn(showLabel && "justify-start", className)}
      size={showLabel ? "default" : "icon"}
      variant="outline"
    >
      <a
        aria-label={t("feedback.viewBoard")}
        data-testid="userjot-board-link"
        href={USERJOT_BOARD_URL}
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ExternalLink data-icon={showLabel ? "inline-start" : undefined} />
        {showLabel ? t("feedback.viewBoard") : null}
      </a>
    </Button>
  )
}
