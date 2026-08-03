import { useTranslation } from "react-i18next"
import { ColorPicker } from "@workspace/ui/components/color-picker"
import { cn } from "@workspace/ui/lib/utils"

// Predefined swatch options (plan §6) — a small, deliberately generic accent palette; any project
// can still pick an arbitrary color via the custom picker below.
const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#6b7280",
] as const

/**
 * A project's color selector — predefined swatches plus a native `<input type="color">` for any
 * custom color (plan §6). `value` is the project's raw hex string, or `null`/empty for "no color".
 * Split out of `manage-projects-sheet.tsx` to keep that file focused on the surrounding CRUD form.
 */
export function ProjectColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const { t } = useTranslation()
  const normalized = value.trim().toLowerCase()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLORS.map((preset) => (
        <button
          aria-label={preset}
          aria-pressed={normalized === preset}
          className={cn(
            "size-6 rounded-full ring-offset-2 ring-offset-background transition-shadow",
            normalized === preset ? "ring-2 ring-ring" : ""
          )}
          key={preset}
          onClick={() => onChange(preset)}
          style={{ backgroundColor: preset }}
          type="button"
        />
      ))}
      <ColorPicker
        aria-label={t("goals.project.customColor")}
        className={cn(
          "size-6 border-dashed border-muted-foreground ring-offset-2 ring-offset-background",
          !(PRESET_COLORS as readonly string[]).includes(normalized) && value
            ? "ring-2 ring-ring"
            : ""
        )}
        data-testid="project-color-custom-input"
        onChange={onChange}
        value={value}
      />
    </div>
  )
}
