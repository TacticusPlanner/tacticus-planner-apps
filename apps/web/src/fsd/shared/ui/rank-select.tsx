import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { Rank } from "@workspace/game-domain"

import { RankBadge } from "./rank-badge"

export function RankSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Rank
  options: Rank[]
  onChange: (rank: Rank) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Rank)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((rank) => (
            <SelectItem key={rank} value={rank}>
              <RankBadge rank={rank} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
