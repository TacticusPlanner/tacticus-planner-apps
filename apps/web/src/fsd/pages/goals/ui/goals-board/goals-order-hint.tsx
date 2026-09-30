import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

/** The priority-order explanation as a control-row affordance (`goals-navigation`: "Goals explains
 * its priority order compactly") — opens on click/tap and on keyboard focus; adds the account-wide
 * position sentence when a project scope is selected. */
export function GoalsOrderHint({ scoped }: { scoped: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // Keyboard focus opens the hint; a pointer press also focuses the trigger first, and opening
  // there would make the click that follows toggle it straight back shut.
  const viaPointer = useRef(false)
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("goals.order.hintLabel")}
          data-testid="goals-order-hint"
          onFocus={() => {
            if (!viaPointer.current) setOpen(true)
            viaPointer.current = false
          }}
          onPointerDown={() => {
            viaPointer.current = true
          }}
          size="icon-sm"
          variant="ghost"
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm"
        data-testid="goals-order-hint-content"
      >
        <p>{t("goals.order.listNote")}</p>
        {scoped ? <p className="mt-2">{t("goals.order.scopedNote")}</p> : null}
      </PopoverContent>
    </Popover>
  )
}
