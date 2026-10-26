import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import type { GoalKind } from "@/entities/goal"

import { GoalEditNotesField } from "../goal-edit/goal-edit-fields"

/** A goal type card's optional note, behind a collapsed "Add note" until it is opened or has text. */
export function GoalNoteDisclosure({
  kind,
  note,
  onChange,
}: {
  kind: GoalKind
  note: string
  onChange: (note: string) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return open || note.length > 0 ? (
    <div data-testid={`create-goal-note-${kind}`}>
      <GoalEditNotesField notes={note} onChange={onChange} />
    </div>
  ) : (
    <Button
      className="justify-self-start"
      data-testid={`create-goal-add-note-${kind}`}
      onClick={() => setOpen(true)}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Plus />
      {t("goals.create.notes.add")}
    </Button>
  )
}
