import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The one search box for a page toolbar's Find slot (ui-style-guide rule 3): a search icon, the
 * input, and a clear X while it holds text. It grows to fill the row up to `sm:max-w-sm`. The
 * placeholder is "Search by name" unless the page searches something else.
 *
 * With `debounceMs` the field keeps its own draft and reports it once typing pauses (for a search
 * that writes the URL or filters a large list); a `value` changed from outside still replaces the
 * draft. Clearing reports at once.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  debounceMs = 0,
  disabled = false,
  className,
  testId,
}: {
  value: string
  onChange: (value: string) => void
  /** The input's accessible name, e.g. "Search NPCs". */
  label: string
  /** Defaults to "Search by name". */
  placeholder?: string
  debounceMs?: number
  disabled?: boolean
  className?: string
  /** On the input. */
  testId?: string
}) {
  const { t } = useTranslation("common")
  const [draft, setDraft] = useState(value)
  const [followed, setFollowed] = useState(value)
  const [sent, setSent] = useState<string | null>(null)
  if (value !== followed) {
    setFollowed(value)
    // The echo of our own report keeps the draft (typing may have moved on); anything else from
    // outside replaces it. Either way the report is consumed, so a later outside value equal to it
    // still replaces the draft.
    if (value !== sent) setDraft(value)
    setSent(null)
  }

  useEffect(() => {
    if (debounceMs <= 0 || draft === value) return
    const timer = setTimeout(() => {
      setSent(draft)
      onChange(draft)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [debounceMs, draft, value, onChange])

  // Without a delay the field is controlled by `value`; with one it shows its own draft.
  const shown = debounceMs > 0 ? draft : value
  const change = (next: string) => {
    setDraft(next)
    if (debounceMs <= 0 || next === "") {
      setSent(next)
      onChange(next)
    }
  }

  return (
    <div className={cn("relative min-w-40 flex-1 sm:max-w-sm", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-icon -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={label}
        className="pr-9 pl-8 [&::-webkit-search-cancel-button]:hidden"
        data-testid={testId}
        disabled={disabled}
        onChange={(event) => change(event.target.value)}
        placeholder={placeholder ?? t("searchField.placeholder")}
        type="search"
        value={shown}
      />
      {shown === "" || disabled ? null : (
        <button
          aria-label={t("searchField.clear")}
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm interactive-surface text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary pointer-coarse:after:absolute pointer-coarse:after:-inset-3"
          data-testid={testId ? `${testId}-clear` : undefined}
          onClick={() => change("")}
          type="button"
        >
          <X aria-hidden className="size-icon" />
        </button>
      )}
    </div>
  )
}
