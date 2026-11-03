import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"

import { MAX_PLAN_NOTES_LENGTH, planNotesChanged } from "../model/plan-notes"
import { usePlanNotes } from "../model/use-plan-notes"

/**
 * The event's personal notes (signed in): a text box saved with the plan, shown on the event
 * Overview. The draft stays local until Save; Discard returns to the stored notes. A failed save
 * keeps the draft so nothing typed is lost.
 */
export function PlanNotesCard({ eventId }: { eventId: string }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const { enabled, state, notes, save } = usePlanNotes(eventId)
  // `null` while not editing: the box then shows the stored notes (and follows a reload).
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fieldId = useId()
  const hintId = useId()

  if (!enabled) return null

  const value = draft ?? notes
  const dirty = draft !== null && planNotesChanged(notes, draft)
  const number = new Intl.NumberFormat(i18n.language)

  const onSave = async () => {
    if (draft === null) return
    setSaving(true)
    const outcome = await save(draft)
    setSaving(false)
    if (outcome !== "error") setDraft(null)
  }

  return (
    <Card data-testid="legendary-event-notes">
      <CardHeader>
        <CardTitle>
          <h2>
            <label htmlFor={fieldId}>{t("notes.title")}</label>
          </h2>
        </CardTitle>
        <CardDescription>{t("notes.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {state === "loading" ? (
          <Skeleton
            className="h-16 w-full rounded-2xl"
            data-testid="legendary-event-notes-loading"
          />
        ) : null}
        {state === "error" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="legendary-event-notes-error"
            role="alert"
          >
            {t("notes.loadError")}
          </p>
        ) : null}
        {state === "ready" ? (
          <>
            <Textarea
              aria-describedby={hintId}
              data-testid="legendary-event-notes-input"
              disabled={saving}
              id={fieldId}
              maxLength={MAX_PLAN_NOTES_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("notes.placeholder")}
              value={value}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground" id={hintId}>
                {dirty ? `${t("notes.unsaved")} · ` : ""}
                {t("notes.count", {
                  length: number.format(value.length),
                  max: number.format(MAX_PLAN_NOTES_LENGTH),
                })}
              </p>
              <div className="flex gap-2">
                {dirty ? (
                  <Button
                    data-testid="legendary-event-notes-discard"
                    disabled={saving}
                    onClick={() => setDraft(null)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {t("notes.discard")}
                  </Button>
                ) : null}
                <Button
                  data-testid="legendary-event-notes-save"
                  disabled={!dirty || saving}
                  onClick={() => void onSave()}
                  size="sm"
                  type="button"
                >
                  {saving ? t("notes.saving") : t("notes.save")}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
