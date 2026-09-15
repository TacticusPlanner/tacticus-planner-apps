import { MessageSquareText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"

import { useUserJot } from "./userjot-provider"

export function UserJotFeedbackButton() {
  const { t } = useTranslation()
  const { open, unreadCount } = useUserJot()

  return (
    <div className="relative">
      <Button
        aria-label={t("feedback.button")}
        data-testid="userjot-feedback-button"
        onClick={() => open()}
        size="icon"
        variant="outline"
      >
        <MessageSquareText />
      </Button>
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive"
          data-testid="userjot-feedback-unread-indicator"
        />
      ) : null}
    </div>
  )
}
