import { MessageSquareText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { IconButton } from "@workspace/ui/components/icon-button"

import { useUserJot } from "./userjot-provider"

export function UserJotFeedbackButton() {
  const { t } = useTranslation()
  const { open, openChangelog, unreadCount, status } = useUserJot()
  const unavailable =
    status === "failed" ? t("nav.quickActions.feedbackUnavailable") : undefined
  // Unread activity is almost always a new changelog post, which only counts as read once opened
  // from Updates, so the dot leads to the newest post; otherwise the button opens the feedback home.
  const hasUnread = unreadCount > 0

  return (
    <div className="relative">
      <IconButton
        className="size-10"
        data-testid="userjot-feedback-button"
        disabledReason={unavailable}
        label={hasUnread ? t("feedback.changelog") : t("feedback.button")}
        onClick={() => (hasUnread ? openChangelog() : open())}
        variant="outline"
      >
        <MessageSquareText />
      </IconButton>
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
