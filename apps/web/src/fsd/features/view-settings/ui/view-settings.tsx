import { Settings } from "lucide-react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"

import { defaultViewSettings } from "../model/view-settings"

export function ViewSettings() {
  const [settings, setSettings] = useState(defaultViewSettings)

  return (
    <section className="flex w-72 flex-col gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Settings className="size-4" />
        View settings
      </div>
      <div className="flex flex-col gap-2">
        {settings.map((setting) => (
          <label
            key={setting.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span>{setting.label}</span>
            <input
              checked={setting.enabled}
              onChange={(event) => {
                setSettings((current) =>
                  current.map((item) =>
                    item.key === setting.key
                      ? { ...item, enabled: event.target.checked }
                      : item
                  )
                )
              }}
              type="checkbox"
            />
          </label>
        ))}
      </div>
      <Button size="sm" variant="outline">
        Apply
      </Button>
    </section>
  )
}
