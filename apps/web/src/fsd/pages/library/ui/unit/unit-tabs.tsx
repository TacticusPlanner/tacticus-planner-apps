import { useRef, type KeyboardEvent } from "react"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The unit page's tab bar: a `tablist` with roving focus (arrow keys, Home, End move between tabs
 * and select them). On mobile it spans the width in equal columns and stays under the app header.
 */
export function UnitTabs<Tab extends string>({
  tabs,
  active,
  onSelect,
  label,
  isMobile,
  panelId,
  className,
}: {
  tabs: readonly { id: Tab; label: string }[]
  active: Tab
  onSelect: (tab: Tab) => void
  label: string
  isMobile: boolean
  panelId: string
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const target = tabs[(index + tabs.length) % tabs.length]
    if (!target) return
    onSelect(target.id)
    refs.current[(index + tabs.length) % tabs.length]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight") focusTab(index + 1)
    else if (event.key === "ArrowLeft") focusTab(index - 1)
    else if (event.key === "Home") focusTab(0)
    else if (event.key === "End") focusTab(tabs.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex border-b bg-background",
        isMobile
          ? "sticky top-(--mobile-header-height) z-10 grid grid-cols-2"
          : "gap-6",
        className
      )}
      data-testid="unit-tabs"
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="tab"
            id={`${panelId}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "-mb-px border-b-[3px] text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isMobile ? "h-12 px-2" : "h-11 px-1",
              selected
                ? "border-ring text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            data-testid={`unit-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
