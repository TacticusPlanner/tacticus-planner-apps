import { ScrollArea, Separator } from '@workspace/ui'

const tags = Array.from({ length: 24 }, (_, i) => `v1.2.0-beta.${i + 1}`)

export function Default() {
  return (
    <ScrollArea
      style={{ height: 220, width: 260, borderRadius: 12, border: '1px solid var(--border)' }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Tags</div>
        {tags.map((t) => (
          <div key={t}>
            <div style={{ fontSize: 13, padding: '6px 0' }}>{t}</div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
