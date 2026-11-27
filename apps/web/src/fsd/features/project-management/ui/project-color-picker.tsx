import { useTranslation } from "react-i18next"
import { ColorPicker } from "@workspace/ui/components/color-picker"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import { PROJECT_PRESET_COLORS as PRESET_COLORS } from "@/entities/project"

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
        <Pressable
          variant="art"
          aria-label={preset}
          aria-pressed={normalized === preset}
          className={cn(
            "size-6 rounded-full ring-offset-2 ring-offset-background transition-shadow",
            normalized === preset ? "ring-2 ring-ring" : ""
          )}
          key={preset}
          onClick={() => onChange(preset)}
          style={{ backgroundColor: preset }}
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
