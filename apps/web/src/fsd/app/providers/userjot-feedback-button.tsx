import { MessageSquareText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"

import { useUserJot } from "./userjot-provider"

export function UserJotFeedbackButton() {
  const { t } = useTranslation()
  const { open, unreadCount, status } = useUserJot()
  const unavailable =
    status === "failed" ? t("nav.quickActions.feedbackUnavailable") : undefined
  // Unread activity is almost always a new changelog post, which only counts as read once opened
  // from Updates, so the dot leads there; otherwise the button opens the feedback home.
  const hasUnread = unreadCount > 0

  return (
    <div className="relative">
      <Button
        aria-label={hasUnread ? t("feedback.changelog") : t("feedback.button")}
        data-testid="userjot-feedback-button"
        disabled={Boolean(unavailable)}
        onClick={() => (hasUnread ? open({ to: "updates" }) : open())}
        title={unavailable}
        size="icon"
        variant="outline"
      >
        <MessageSquareText />
      </Button>
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive"
          data-testid="userjot-feedback-unread-indicator"
        />
      ) : null}
    </div>
  )
}
